import type { Agent, Issue } from './types'

const API_URL = import.meta.env.VITE_PAPERCLIP_API_URL || ''
const API_KEY = import.meta.env.VITE_PAPERCLIP_API_KEY || ''
const COMPANY_ID = import.meta.env.VITE_PAPERCLIP_COMPANY_ID || ''

export const isDemoMode =
  !API_URL ||
  API_URL === 'REPLACE_WITH_VALUE' ||
  !API_KEY ||
  API_KEY === 'REPLACE_WITH_VALUE' ||
  !COMPANY_ID ||
  COMPANY_ID === 'REPLACE_WITH_VALUE'

const headers = () => ({
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
})

export async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch(`${API_URL}/api/companies/${COMPANY_ID}/agents`, {
    headers: headers(),
  })
  if (!res.ok) throw new Error(`agents fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchActiveIssues(): Promise<Issue[]> {
  const res = await fetch(
    `${API_URL}/api/companies/${COMPANY_ID}/issues?status=in_progress,todo,blocked&limit=50`,
    { headers: headers() },
  )
  if (!res.ok) throw new Error(`issues fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchRecentDone(): Promise<Issue[]> {
  const res = await fetch(
    `${API_URL}/api/companies/${COMPANY_ID}/issues?status=done&limit=20`,
    { headers: headers() },
  )
  if (!res.ok) throw new Error(`done issues fetch failed: ${res.status}`)
  return res.json()
}
