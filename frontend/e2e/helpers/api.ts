/**
 * api.ts
 * Typed wrappers around the piClinic v2 REST API for E2E test setup.
 * All functions accept a session token and the base URL from env.
 *
 * Used only for CREATE operations in beforeEach.
 * Teardown is handled via direct SQL in db.ts.
 */

import { env } from './env.js'

interface ApiOptions {
  token: string
}

async function post<T>(path: string, body: unknown, { token }: ApiOptions): Promise<T> {
  const res = await fetch(`${env.baseUrl}/api/v2${path}`, {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'X-Session-Token': token,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`)
  }
  const envelope = await res.json()
  return envelope.data as T
}

// ---------------------------------------------------------------------------
// Patient
// ---------------------------------------------------------------------------

export interface CreatedPatient {
  clinicPatientID: string
}

export async function createPatient(
  opts: ApiOptions & { clinicPatientID: string; lastName: string; firstName: string; sex: 'M' | 'F' | 'X' }
): Promise<CreatedPatient> {
  const { token, ...body } = opts
  return post<CreatedPatient>('/patients', body, { token })
}

// ---------------------------------------------------------------------------
// Visit
// ---------------------------------------------------------------------------

export interface CreatedVisit {
  patientVisitID:  string
  clinicPatientID: string
}

export async function createVisit(
  opts: ApiOptions & {
    clinicPatientID: string
    visitType:       string
    primaryComplaint?: string
  }
): Promise<CreatedVisit> {
  const { token, ...body } = opts
  return post<CreatedVisit>('/visits', body, { token })
}
