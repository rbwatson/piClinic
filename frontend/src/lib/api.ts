/**
 * api.ts
 * Axios instance for the piClinic v2 API.
 *
 * Session token lifecycle:
 *   - Stored in module-level variable (in-memory only, no localStorage).
 *   - Set via setSessionToken() after successful login.
 *   - Cleared via clearSessionToken() on logout or 401 response.
 *   - Injected into every request via request interceptor.
 *
 * On 401, the response interceptor clears the token and dispatches a
 * custom 'piclinic:unauthorized' event so AuthContext can redirect
 * to the login page without creating a circular import.
 *
 * Response envelope conventions:
 *   - POST/create endpoints return { status: 'success', data: T }
 *   - GET list endpoints return bare arrays: T[]
 *   - GET single endpoints return bare objects: T
 *   - The Axios interceptor does NOT unwrap envelopes; callers handle this.
 */

import axios from 'axios'

const BASE_URL = '/api/v2'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

// ---------------------------------------------------------------------------
// Session token store
// ---------------------------------------------------------------------------

let _sessionToken: string | null = null

export function setSessionToken(token: string): void {
  _sessionToken = token
}

export function clearSessionToken(): void {
  _sessionToken = null
}

export function getSessionToken(): string | null {
  return _sessionToken
}

// ---------------------------------------------------------------------------
// Request interceptor — attach token
// ---------------------------------------------------------------------------

api.interceptors.request.use((config) => {
  if (_sessionToken) {
    config.headers['X-Session-Token'] = _sessionToken
  }
  return config
})

// ---------------------------------------------------------------------------
// Response interceptor — handle 401
// ---------------------------------------------------------------------------

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSessionToken()
      window.dispatchEvent(new CustomEvent('piclinic:unauthorized'))
    }
    return Promise.reject(error)
  }
)

export default api
