import { useState, useEffect } from 'react'
import type { Agent, Issue } from '../types'
import { ROOMS } from '../rooms'
import { Room } from './Room'
import { TreasuryTerminal } from './TreasuryTerminal'
import { AgentDot } from './AgentDot'

interface Props {
  agents: Agent[]
  activeIssues: Issue[]
  doneIssues: Issue[]
  isLive: boolean
  lastRefresh: Date | null
}

function getIdleAgents(agents: Agent[], rooms: typeof ROOMS): Agent[] {
  const assignedIds = new Set(rooms.flatMap((r) => r.agentIds))
  return agents.filter((a) => !assignedIds.has(a.id))
}

export function SpaceStation({ agents, activeIssues, doneIssues, isLive, lastRefresh }: Props) {
  const [tick, setTick] = useState(0)
  const [showTreasury, setShowTreasury] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000)
    return () => clearInterval(id)
  }, [])

  const idleAgents = getIdleAgents(agents, ROOMS)
  const runningCount = agents.filter((a) => a.status === 'running').length
  const inProgressCount = activeIssues.filter((i) => i.status === 'in_progress').length
  const blockedCount = activeIssues.filter((i) => i.status === 'blocked').length

  const treasuryRoom = ROOMS.find((r) => r.id === 'treasury')!
  const archivesRoom = ROOMS.find((r) => r.id === 'archives')!
  const quartersRoom = ROOMS.find((r) => r.id === 'quarters')!

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: 12,
      gap: 10,
      overflow: 'hidden',
    }}>
      {/* Status bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '6px 12px',
        background: '#060e06',
        border: '1px solid #003309',
        borderRadius: 4,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        <span style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: 18,
          color: '#00ff41',
          textShadow: '0 0 12px #00ff41, 0 0 24px rgba(0,255,65,0.3)',
          letterSpacing: 3,
          animation: 'flicker 8s linear infinite',
        }}>
          ★ MINIONS
        </span>

        <div style={{ height: 16, width: 1, background: '#003309' }} />

        {[
          { label: 'AGENTS', value: agents.length, color: '#00ff41' },
          { label: 'RUNNING', value: runningCount, color: '#00ff41' },
          { label: 'MISSIONS', value: inProgressCount, color: '#00aa2a' },
          { label: 'BLOCKED', value: blockedCount, color: blockedCount > 0 ? '#ff3131' : '#3a4a3a' },
        ].map((stat) => (
          <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, color: '#3a4a3a', letterSpacing: 1 }}>{stat.label}</span>
            <span style={{ fontSize: 14, color: stat.color, fontFamily: 'var(--font-pixel)', textShadow: stat.value > 0 ? `0 0 6px ${stat.color}` : 'none' }}>
              {stat.value}
            </span>
          </div>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {isLive ? (
            <span style={{ fontSize: 10, color: '#00ff41', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff41', boxShadow: '0 0 6px #00ff41', display: 'inline-block', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
              LIVE
            </span>
          ) : (
            <span style={{ fontSize: 10, color: '#ffb700', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffb700', display: 'inline-block' }} />
              DEMO MODE
            </span>
          )}
          {lastRefresh && (
            <span style={{ fontSize: 9, color: '#3a4a3a' }}>
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Grid layout */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateAreas: `
          "bridge    bridge    bridge    bridge"
          "strategy  factory   factory   mobile"
          "design    warroom   warroom   mobile"
          "treasury  warroom   archives  quarters"
        `,
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gridTemplateRows: 'auto 1fr 1fr auto',
        gap: 8,
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {/* Main rooms */}
        {ROOMS.filter((r) => !['treasury', 'archives', 'quarters'].includes(r.id)).map((room) => {
          const roomDoneIssues = doneIssues.filter(
            (i) => i.assigneeAgentId && room.agentIds.includes(i.assigneeAgentId),
          )
          return (
            <Room
              key={room.id}
              room={room}
              agents={agents}
              issues={activeIssues}
              doneIssues={roomDoneIssues}
            />
          )
        })}

        {/* Treasury */}
        <div
          onClick={() => setShowTreasury(true)}
          style={{
            gridArea: 'treasury',
            background: '#060e06',
            border: '2px solid #ffd70055',
            borderRadius: 4,
            padding: '8px 12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ffd700'
            e.currentTarget.style.boxShadow = '0 0 12px #ffd70033'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#ffd70055'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 12, color: '#ffd70088', letterSpacing: 1 }}>
            💰 TREASURY
          </span>
          <span style={{ fontSize: 10, color: '#ffd70055' }}>
            ${(agents.reduce((s, a) => s + a.spentMonthlyCents, 0) / 100).toFixed(2)} spent
          </span>
        </div>

        {/* Archives */}
        <div
          style={{
            gridArea: 'archives',
            background: '#060e06',
            border: '2px solid #3a4a3a55',
            borderRadius: 4,
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 12, color: '#4a5a4a', letterSpacing: 1 }}>
            🗄 ARCHIVES
          </span>
          <span style={{ fontSize: 10, color: '#3a4a3a' }}>
            {doneIssues.length} missions logged
          </span>
        </div>

        {/* Quarters */}
        <div
          style={{
            gridArea: 'quarters',
            background: '#060e06',
            border: '2px solid #2a3a2a55',
            borderRadius: 4,
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 12, color: '#2a4a2a', letterSpacing: 1 }}>
            🎮 QUARTERS
          </span>
          {idleAgents.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {idleAgents.map((agent) => (
                <AgentDot key={agent.id} agent={agent} isActive={false} />
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 10, color: '#2a3a2a' }}>all crew deployed</span>
          )}
        </div>
      </div>

      {showTreasury && (
        <TreasuryTerminal agents={agents} onClose={() => setShowTreasury(false)} />
      )}
    </div>
  )
}
