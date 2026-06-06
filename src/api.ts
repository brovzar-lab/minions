import type { Agent, Issue } from './types'

const API_URL = import.meta.env.VITE_PAPERCLIP_API_URL || ''
const API_KEY = import.meta.env.VITE_PAPERCLIP_API_KEY || ''
const COMPANY_ID = import.meta.env.VITE_PAPERCLIP_COMPANY_ID || ''
// Set VITE_PAPERCLIP_PROXY=true when building for VPS (server.js handles auth via proxy)
const PROXY_MODE = import.meta.env.VITE_PAPERCLIP_PROXY === 'true'

const isPlaceholder = (v: string) => !v || v === 'REPLACE_WITH_VALUE'

export const isDemoMode =
  isPlaceholder(COMPANY_ID) ||
  (!PROXY_MODE && isPlaceholder(API_KEY) && isPlaceholder(API_URL))

export const COMPANY_ID_VALUE = COMPANY_ID

const headers = (): Record<string, string> => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (!isPlaceholder(API_KEY)) h['Authorization'] = `Bearer ${API_KEY}`
  return h
}

const base = () => API_URL.replace(/\/$/, '')

export async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch(`${base()}/api/companies/${COMPANY_ID}/agents`, {
    headers: headers(),
  })
  if (!res.ok) throw new Error(`agents ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : (data.items ?? [])
}

export async function fetchActiveIssues(): Promise<Issue[]> {
  const res = await fetch(
    `${base()}/api/companies/${COMPANY_ID}/issues?status=in_progress,todo,blocked&limit=50`,
    { headers: headers() },
  )
  if (!res.ok) throw new Error(`issues ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : (data.items ?? [])
}

export async function fetchRecentDone(): Promise<Issue[]> {
  const res = await fetch(
    `${base()}/api/companies/${COMPANY_ID}/issues?status=done&limit=20`,
    { headers: headers() },
  )
  if (!res.ok) throw new Error(`done ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : (data.items ?? [])
}
