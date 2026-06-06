import { useEffect, useRef } from 'react'
import type { RoomConfig, Agent, Issue } from '../types'

const STATUS_COLOR: Record<string, string> = {
  in_progress: '#00ff41',
  todo: '#00aa2a',
  blocked: '#ff3131',
  done: '#008a22',
  backlog: '#3a4a3a',
  in_review: '#ffb700',
  cancelled: '#444',
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#ff3131',
  high: '#ffb700',
  medium: '#00aa2a',
  low: '#3a4a3a',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface Props {
  room: RoomConfig
  agents: Agent[]
  issues: Issue[]
  doneIssues: Issue[]
  allAgents: Agent[]
  onClose: () => void
}

export function Terminal({ room, agents, issues, doneIssues, allAgents, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const apiUrl = import.meta.env.VITE_PAPERCLIP_API_URL || ''
  const agentBaseUrl = apiUrl.replace('/api', '') || 'https://app.paperclip.ing'

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
        animation: 'slide-in 0.15s ease-out',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={ref}
        style={{
          width: '90vw',
          maxWidth: 700,
          maxHeight: '80vh',
          background: '#060e06',
          border: `2px solid ${room.color}`,
          borderRadius: 6,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: `0 0 40px ${room.color}44, 0 0 80px ${room.color}22`,
          overflow: 'hidden',
        }}
      >
        {/* Title bar */}
        <div style={{
          background: `${room.color}18`,
          borderBottom: `1px solid ${room.color}55`,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: 16,
            color: room.color,
            textShadow: `0 0 8px ${room.color}`,
            letterSpacing: 2,
          }}>
            {room.emoji} {room.name} — TERMINAL
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: `1px solid ${room.color}55`,
              color: room.color,
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

        <div style={{ overflowY: 'auto', flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Agents section */}
          {agents.length > 0 && (
            <section>
              <div style={{ color: '#008a22', fontSize: 11, marginBottom: 8, letterSpacing: 2 }}>
                ▸ CREW ({agents.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 10px',
                      background: '#0a140a',
                      border: `1px solid ${agent.status === 'running' ? room.color + '88' : '#003309'}`,
                      borderRadius: 3,
                    }}
                  >
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: agent.status === 'running' ? '#00ff41' : '#003309',
                      boxShadow: agent.status === 'running' ? '0 0 6px #00ff41' : 'none',
                      flexShrink: 0,
                      animation: agent.status === 'running' ? 'pulse-glow 1.5s ease-in-out infinite' : undefined,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#00ff41' }}>{agent.name}</div>
                      <div style={{ fontSize: 10, color: '#008a22' }}>{agent.title}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontSize: 10,
                        color: agent.status === 'running' ? '#00ff41' : '#008a22',
                        textTransform: 'uppercase',
                      }}>
                        {agent.status}
                      </div>
                      {agent.lastHeartbeatAt && (
                        <div style={{ fontSize: 9, color: '#3a4a3a' }}>
                          {timeAgo(agent.lastHeartbeatAt)}
                        </div>
                      )}
                    </div>
                    {agent.budgetMonthlyCents > 0 && (
                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 60 }}>
                        <div style={{ fontSize: 9, color: '#ffd70088' }}>
                          ${(agent.spentMonthlyCents / 100).toFixed(2)} / ${(agent.budgetMonthlyCents / 100).toFixed(0)}
                        </div>
                        <div style={{
                          height: 3,
                          background: '#003309',
                          borderRadius: 2,
                          overflow: 'hidden',
                          width: 60,
                          marginTop: 2,
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, (agent.spentMonthlyCents / agent.budgetMonthlyCents) * 100)}%`,
                            background: agent.spentMonthlyCents / agent.budgetMonthlyCents > 0.8 ? '#ff3131' : '#00ff41',
                            transition: 'width 0.3s',
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active issues */}
          {issues.length > 0 && (
            <section>
              <div style={{ color: '#008a22', fontSize: 11, marginBottom: 8, letterSpacing: 2 }}>
                ▸ ACTIVE MISSIONS ({issues.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {issues.map((issue) => {
                  const assignee = allAgents.find((a) => a.id === issue.assigneeAgentId)
                  return (
                    <div
                      key={issue.id}
                      style={{
                        padding: '8px 10px',
                        background: '#0a140a',
                        border: `1px solid ${STATUS_COLOR[issue.status] ?? '#003309'}44`,
                        borderLeft: `3px solid ${STATUS_COLOR[issue.status] ?? '#003309'}`,
                        borderRadius: 3,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, justifyContent: 'space-between' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                            <span style={{
                              fontSize: 10,
                              color: '#008a22',
                              fontFamily: 'var(--font-mono)',
                            }}>
                              {issue.identifier}
                            </span>
                            <span style={{
                              fontSize: 9,
                              color: PRIORITY_COLOR[issue.priority] ?? '#008a22',
                              textTransform: 'uppercase',
                              border: `1px solid ${PRIORITY_COLOR[issue.priority] ?? '#008a22'}55`,
                              padding: '0 4px',
                              borderRadius: 2,
                            }}>
                              {issue.priority}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#00cc33', lineHeight: 1.3 }}>
                            {issue.title}
                          </div>
                          {assignee && (
                            <div style={{ fontSize: 9, color: '#008a22', marginTop: 3 }}>
                              › {assignee.name}
                            </div>
                          )}
                        </div>
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <div style={{
                            fontSize: 10,
                            color: STATUS_COLOR[issue.status] ?? '#008a22',
                            textTransform: 'uppercase',
                            marginBottom: 2,
                          }}>
                            {issue.status.replace('_', ' ')}
                          </div>
                          <div style={{ fontSize: 9, color: '#3a4a3a' }}>
                            {timeAgo(issue.updatedAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Done issues */}
          {doneIssues.length > 0 && (
            <section>
              <div style={{ color: '#008a22', fontSize: 11, marginBottom: 8, letterSpacing: 2 }}>
                ▸ COMPLETED ({doneIssues.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {doneIssues.map((issue) => (
                  <div
                    key={issue.id}
                    style={{
                      padding: '5px 10px',
                      background: '#060e06',
                      border: '1px solid #003309',
                      borderRadius: 3,
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 10, color: '#008a22' }}>✓</span>
                    <span style={{ fontSize: 10, color: '#3a4a3a', fontFamily: 'var(--font-mono)' }}>{issue.identifier}</span>
                    <span style={{ fontSize: 11, color: '#3a4a3a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {issue.title}
                    </span>
                    <span style={{ fontSize: 9, color: '#1a2a1a', flexShrink: 0 }}>
                      {timeAgo(issue.updatedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {agents.length === 0 && issues.length === 0 && (
            <div style={{ textAlign: 'center', color: '#3a4a3a', padding: '20px 0', fontSize: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{room.emoji}</div>
              {room.description}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: `1px solid ${room.color}22`,
          padding: '6px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: `${room.color}08`,
        }}>
          <span style={{ fontSize: 9, color: '#3a4a3a' }}>
            {room.description}
          </span>
          <span style={{ fontSize: 9, color: '#3a4a3a', animation: 'blink 1.2s step-end infinite' }}>
            ■
          </span>
        </div>
      </div>
    </div>
  )
}
