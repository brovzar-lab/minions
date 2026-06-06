import type { Agent } from '../types'

const ROLE_CHARS: Record<string, string> = {
  ceo: '★',
  cto: '◈',
  cmo: '◉',
  pm: '◇',
  engineer: '▣',
  designer: '◆',
  qa: '◎',
}

const ROLE_COLORS: Record<string, string> = {
  ceo: '#c800ff',
  cto: '#c800ff',
  cmo: '#ffb700',
  pm: '#ffb700',
  engineer: '#00ff41',
  designer: '#ff6ad5',
  qa: '#ff3131',
}

interface Props {
  agent: Agent
  isActive: boolean
}

export function AgentDot({ agent, isActive }: Props) {
  const char = ROLE_CHARS[agent.role] ?? '●'
  const color = ROLE_COLORS[agent.role] ?? '#00ff41'

  return (
    <div
      title={agent.title || agent.name}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        cursor: 'default',
        animation: isActive ? 'drift 4s ease-in-out infinite' : undefined,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: `radial-gradient(circle at 40% 35%, ${color}33, ${color}11)`,
          border: `1.5px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          color,
          boxShadow: isActive
            ? `0 0 8px ${color}, 0 0 16px ${color}44`
            : `0 0 4px ${color}44`,
          position: 'relative',
        }}
      >
        {char}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              top: -3,
              right: -3,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#00ff41',
              boxShadow: '0 0 6px #00ff41',
              animation: 'pulse-glow 1.5s ease-in-out infinite',
            }}
          />
        )}
      </div>
      <span
        style={{
          fontSize: 9,
          color: isActive ? color : '#008a22',
          fontFamily: 'var(--font-mono)',
          maxWidth: 36,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        {agent.name.split(' ')[0]}
      </span>
    </div>
  )
}
