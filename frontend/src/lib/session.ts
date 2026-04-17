/**
 * session.ts
 * Session storage helpers for persisting the auth token
 * across page reloads within the same browser tab.
 *
 * sessionStorage is cleared when the tab closes — appropriate for kiosk use.
 * Extracted to a separate file so AuthContext.tsx only exports components
 * (required for Vite fast refresh).
 */

export const SESSION_STORAGE_KEY = 'piclinic_session_token'

export function getStoredToken(): string | null {
  return sessionStorage.getItem(SESSION_STORAGE_KEY)
}

export function storeToken(token: string): void {
  sessionStorage.setItem(SESSION_STORAGE_KEY, token)
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
}
