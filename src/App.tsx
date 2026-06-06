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
    refetchInterval: 30000,
    staleTime: 20000,
  })

  const issuesQuery = useQuery({
    queryKey: ['issues-active'],
    queryFn: fetchActiveIssues,
    enabled: !isDemoMode,
    refetchInterval: 20000,
    staleTime: 15000,
  })

  const doneQuery = useQuery({
    queryKey: ['issues-done'],
    queryFn: fetchRecentDone,
    enabled: !isDemoMode,
    refetchInterval: 60000,
    staleTime: 50000,
  })

  const agents = isDemoMode ? demoAgents : (agentsQuery.data ?? [])
  const activeIssues = isDemoMode ? demoActiveIssues : (issuesQuery.data ?? [])
  const doneIssues = isDemoMode ? demoDoneIssues : (doneQuery.data ?? [])

  const lastRefresh = !isDemoMode && agentsQuery.dataUpdatedAt
    ? new Date(agentsQuery.dataUpdatedAt)
    : null

  const isLoading = !isDemoMode && (agentsQuery.isLoading || issuesQuery.isLoading)
  const apiError = !isDemoMode && !isLoading && agentsQuery.isError
    ? (agentsQuery.error as Error)?.message ?? 'unknown error'
    : null

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
      {apiError && (
        <div style={{
          position: 'fixed', top: 8, right: 8, zIndex: 9999,
          background: '#1a0000', border: '1px solid #ff3131',
          color: '#ff3131', padding: '6px 12px', borderRadius: 4,
          fontSize: 11, fontFamily: 'monospace',
        }}>
          API ERROR: {apiError}
        </div>
      )}
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
