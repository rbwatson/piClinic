/**
 * auth.ts
 * Logs in via the piClinic API and returns a session token.
 * Used by API helpers that need auth for setup/teardown.
 */

import { env } from './env.js'

export interface Session {
  token:    string
  username: string
}

export async function login(): Promise<Session> {
  const res = await fetch(`${env.baseUrl}/api/v2/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      username: env.test.username,
      password: env.test.password,
    }),
  })

  if (!res.ok) {
    throw new Error(`E2E login failed: ${res.status} ${await res.text()}`)
  }

  const body = await res.json()
  return { token: body.data.token, username: body.data.username }
}

export async function logout(token: string): Promise<void> {
  await fetch(`${env.baseUrl}/api/v2/auth/logout`, {
    method:  'POST',
    headers: { 'X-Session-Token': token },
  })
}
