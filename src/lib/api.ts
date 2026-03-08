const API_BASE = 'https://zen-api-2clxntdemq-de.a.run.app'
const API_KEY = 'zen-dev-key-2026'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || (body?.details && body.details.join('；')) || `API ${res.status}: ${res.statusText}`)
  }
  return res.json()
}
