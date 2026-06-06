import { useEffect } from 'react'
import type { Agent } from '../types'

interface Props {
  agents: Agent[]
  onClose: () => void
}

export function TreasuryTerminal({ agents, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const totalBudget = agents.reduce((sum, a) => sum + a.budgetMonthlyCents, 0)
  const totalSpent = agents.reduce((sum, a) => sum + a.spentMonthlyCents, 0)
  const activeAgents = agents.filter((a) => a.spentMonthlyCents > 0)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '90vw',
        maxWidth: 600,
        maxHeight: '80vh',
        background: '#060e06',
        border: '2px solid #ffd700',
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 0 40px #ffd70044, 0 0 80px #ffd70022',
        overflow: 'hidden',
      }}>
        <div style={{
          background: '#ffd70018',
          borderBottom: '1px solid #ffd70055',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: 16,
            color: '#ffd700',
            textShadow: '0 0 8px #ffd700',
            letterSpacing: 2,
          }}>
            💰 TREASURY — BUDGET CONTROL
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #ffd70055',
              color: '#ffd700',
              cursor: 'pointer',
              padding: '2px 8px',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              borderRadius: 3,
            }}
          >
            [ESC]
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: 16 }}>
          {/* Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
            marginBottom: 20,
          }}>
            {[
              { label: 'TOTAL BUDGET', value: `$${(totalBudget / 100).toFixed(0)}/mo`, color: '#ffd700' },
              { label: 'SPENT THIS MONTH', value: `$${(totalSpent / 100).toFixed(2)}`, color: '#00ff41' },
              { label: 'REMAINING', value: `$${((totalBudget - totalSpent) / 100).toFixed(2)}`, color: totalBudget - totalSpent < 0 ? '#ff3131' : '#00aa2a' },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: '#0a140a',
                border: `1px solid ${stat.color}44`,
                borderRadius: 4,
                padding: '10px 12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 9, color: '#3a4a3a', letterSpacing: 1, marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: 18, color: stat.color, fontFamily: 'var(--font-pixel)', textShadow: `0 0 8px ${stat.color}88` }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Per-agent budget */}
          <div style={{ color: '#008a22', fontSize: 11, marginBottom: 10, letterSpacing: 2 }}>
            ▸ AGENT BURN RATE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {agents
              .filter((a) => a.budgetMonthlyCents > 0 || a.spentMonthlyCents > 0)
              .sort((a, b) => b.spentMonthlyCents - a.spentMonthlyCents)
              .map((agent) => {
                const pct = agent.budgetMonthlyCents > 0
                  ? (agent.spentMonthlyCents / agent.budgetMonthlyCents) * 100
                  : 100
                const barColor = pct > 80 ? '#ff3131' : pct > 50 ? '#ffb700' : '#00ff41'
                return (
                  <div
                    key={agent.id}
                    style={{
                      padding: '8px 10px',
                      background: '#0a140a',
                      border: '1px solid #003309',
                      borderRadius: 3,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#00cc33' }}>{agent.name}</span>
                      <span style={{ fontSize: 10, color: '#ffd70088' }}>
                        ${(agent.spentMonthlyCents / 100).toFixed(2)}
                        {agent.budgetMonthlyCents > 0 ? ` / $${(agent.budgetMonthlyCents / 100).toFixed(0)}` : ''}
                      </span>
                    </div>
                    {agent.budgetMonthlyCents > 0 && (
                      <div style={{ height: 4, background: '#003309', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, pct)}%`,
                          background: barColor,
                          boxShadow: `0 0 6px ${barColor}88`,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
