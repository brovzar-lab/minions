export interface Agent {
  id: string
  name: string
  role: string
  title: string | null
  icon: string | null
  status: 'idle' | 'running' | 'paused'
  urlKey: string
  reportsTo: string | null
  spentMonthlyCents: number
  budgetMonthlyCents: number
  lastHeartbeatAt: string | null
}

export interface Issue {
  id: string
  identifier: string
  title: string
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked' | 'cancelled'
  priority: 'critical' | 'high' | 'medium' | 'low'
  assigneeAgentId: string | null
  updatedAt: string
  projectId: string | null
}

export interface RoomConfig {
  id: string
  name: string
  emoji: string
  description: string
  agentIds: string[]
  color: string
  gridArea: string
}
