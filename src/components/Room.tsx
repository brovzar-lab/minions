import { useState } from 'react'
import type { RoomConfig, Agent, Issue } from '../types'
import { AgentDot } from './AgentDot'
import { Terminal } from './Terminal'

interface Props {
  room: RoomConfig
  agents: Agent[]
  issues: Issue[]
  doneIssues?: Issue[]
}

export function Room({ room, agents, issues, doneIssues = [] }: Props) {
  const [open, setOpen] = useState(false)

  const roomAgents = agents.filter((a) => room.agentUrlKeys.includes(a.urlKey))
  const roomIssues = issues.filter((i) => {
    if (!i.assigneeAgentId) return false
    const assignee = agents.find((a) => a.id === i.assigneeAgentId)
    return assignee && room.agentUrlKeys.includes(assignee.urlKey)
  })
  const activeCount = roomIssues.filter((i) => i.status === 'in_progress').length
  const blockedCount = roomIssues.filter((i) => i.status === 'blocked').length
  const runningAgents = roomAgents.filter((a) => a.status === 'running')

  // Treasury and Archives/Quarters are data rooms, not agent rooms
  const isDataRoom = room.agentUrlKeys.length === 0

  const borderColor = blockedCount > 0 ? '#ff3131' : activeCount > 0 ? room.color : '#003309'
  const glowIntensity = activeCount > 0 || runningAgents.length > 0 ? 1 : 0.3

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{
          gridArea: room.gridArea,
          background: `linear-gradient(135deg, #060e06 0%, #0a140a 100%)`,
          border: `2px solid ${borderColor}`,
          borderRadius: 4,
          padding: '10px 12px',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          boxShadow: `0 0 ${12 * glowIntensity}px ${borderColor}${Math.round(glowIntensity * 60).toString(16).padStart(2, '0')}, inset 0 0 ${8 * glowIntensity}px ${borderColor}11`,
          minHeight: 80,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = room.color
          e.currentTarget.style.boxShadow = `0 0 20px ${room.color}55, inset 0 0 12px ${room.color}18`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = borderColor
          e.currentTarget.style.boxShadow = `0 0 ${12 * glowIntensity}px ${borderColor}${Math.round(glowIntensity * 60).toString(16).padStart(2, '0')}, inset 0 0 ${8 * glowIntensity}px ${borderColor}11`
        }}
      >
        {/* Corner decoration */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: 8, height: 8,
          borderTop: `2px solid ${room.color}`,
          borderLeft: `2px solid ${room.color}`,
        }} />
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 8, height: 8,
          borderTop: `2px solid ${room.color}`,
          borderRight: `2px solid ${room.color}`,
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          width: 8, height: 8,
          borderBottom: `2px solid ${room.color}`,
          borderLeft: `2px solid ${room.color}`,
        }} />
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 8, height: 8,
          borderBottom: `2px solid ${room.color}`,
          borderRight: `2px solid ${room.color}`,
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{room.emoji}</span>
            <span style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: 14,
              color: room.color,
              textShadow: `0 0 8px ${room.color}88`,
              letterSpacing: 1,
            }}>
              {room.name}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {blockedCount > 0 && (
              <span style={{
                background: '#ff313122',
                border: '1px solid #ff3131',
                color: '#ff3131',
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 3,
                fontFamily: 'var(--font-mono)',
              }}>
                ⚠ {blockedCount}
              </span>
            )}
            {activeCount > 0 && (
              <span style={{
                background: `${room.color}22`,
                border: `1px solid ${room.color}`,
                color: room.color,
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 3,
                fontFamily: 'var(--font-mono)',
                animation: 'pulse-glow 2s ease-in-out infinite',
              }}>
                ▶ {activeCount}
              </span>
            )}
          </div>
        </div>

        {/* Agents */}
        {roomAgents.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 2 }}>
            {roomAgents.map((agent) => (
              <AgentDot
                key={agent.id}
                agent={agent}
                isActive={agent.status === 'running'}
              />
            ))}
          </div>
        )}

        {/* Data room content */}
        {isDataRoom && room.id === 'treasury' && (
          <div style={{ fontSize: 10, color: '#ffd70088' }}>
            click to view budget
          </div>
        )}
        {isDataRoom && room.id === 'archives' && (
          <div style={{ fontSize: 10, color: '#7a8a7a88' }}>
            completed missions
          </div>
        )}
        {isDataRoom && room.id === 'quarters' && (
          <div style={{ fontSize: 10, color: '#4a6a4a88' }}>
            idle crew — on standby
          </div>
        )}

        {/* Active task preview */}
        {roomIssues.length > 0 && (
          <div style={{
            marginTop: 2,
            fontSize: 10,
            color: '#00aa2a',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-mono)',
          }}>
            › {roomIssues[0].identifier}: {roomIssues[0].title.slice(0, 40)}{roomIssues[0].title.length > 40 ? '…' : ''}
          </div>
        )}

        {/* Scanline overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${room.color}05 3px, ${room.color}05 4px)`,
          pointerEvents: 'none',
        }} />
      </div>

      {open && (
        <Terminal
          room={room}
          agents={roomAgents}
          issues={roomIssues}
          doneIssues={doneIssues}
          allAgents={agents}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
