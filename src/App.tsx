import { useQuery } from '@tanstack/react-query'
import { SpaceStation } from './components/SpaceStation'
import {
  isDemoMode,
  fetchAgents,
  fetchActiveIssues,
  fetchRecentDone,
} from './api'
import { demoAgents, demoActiveIssues, demoDoneIssues } from './demoData'

export default function App() {
  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    enabled: !isDemoMode,
  })

  const issuesQuery = useQuery({
    queryKey: ['issues-active'],
    queryFn: fetchActiveIssues,
    enabled: !isDemoMode,
  })

  const doneQuery = useQuery({
    queryKey: ['issues-done'],
    queryFn: fetchRecentDone,
    enabled: !isDemoMode,
  })

  const agents = isDemoMode ? demoAgents : (agentsQuery.data ?? [])
  const activeIssues = isDemoMode ? demoActiveIssues : (issuesQuery.data ?? [])
  const doneIssues = isDemoMode ? demoDoneIssues : (doneQuery.data ?? [])

  const lastRefresh = !isDemoMode && agentsQuery.dataUpdatedAt
    ? new Date(agentsQuery.dataUpdatedAt)
    : null

  const isLoading = !isDemoMode && (agentsQuery.isLoading || issuesQuery.isLoading)

  if (isLoading) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: 24,
          color: '#00ff41',
          textShadow: '0 0 16px #00ff41',
          animation: 'blink 1s step-end infinite',
        }}>
          ★ MINIONS
        </div>
        <div style={{ fontSize: 12, color: '#008a22' }}>
          INITIALIZING STATION...
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <SpaceStation
        agents={agents}
        activeIssues={activeIssues}
        doneIssues={doneIssues}
        isLive={!isDemoMode}
        lastRefresh={lastRefresh}
      />
    </div>
  )
}
