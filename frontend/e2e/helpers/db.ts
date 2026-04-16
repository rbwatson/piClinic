/**
 * db.ts
 * Direct MariaDB connection for E2E test verification and teardown.
 *
 * Uses mysql2 (promise API). The piclinic_e2e account has SELECT + DELETE
 * on piclinic.* — enough to verify stored values and clean up test records.
 *
 * Install: npm install --save-dev mysql2  (run in frontend/)
 *
 * All E2E test records use the PT-E2E- prefix for clinicPatientID so
 * stale records from aborted runs can be cleaned up with:
 *   DELETE FROM visit   WHERE clinicPatientID LIKE 'PT-E2E-%';
 *   DELETE FROM patient WHERE clinicPatientID LIKE 'PT-E2E-%';
 */

import mysql from 'mysql2/promise'
import { env } from './env.js'

let _pool: mysql.Pool | null = null

function pool(): mysql.Pool {
  if (!_pool) {
    _pool = mysql.createPool({
      host:     env.db.host,
      port:     env.db.port,
      database: env.db.database,
      user:     env.db.user,
      password: env.db.password,
      waitForConnections: true,
      connectionLimit:    5,
    })
  }
  return _pool
}

/** Run a SELECT and return all rows as plain objects. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const [rows] = await pool().execute(sql, params)
  return rows as T[]
}

/** Delete test visit records for a given patientVisitID. */
export async function deleteVisit(patientVisitID: string): Promise<void> {
  await pool().execute(
    'DELETE FROM visit WHERE patientVisitID = ?',
    [patientVisitID]
  )
}

/** Delete test patient records for a given clinicPatientID. */
export async function deletePatient(clinicPatientID: string): Promise<void> {
  await pool().execute(
    'DELETE FROM patient WHERE clinicPatientID = ?',
    [clinicPatientID]
  )
}

/** Close all connections — call in globalTeardown if needed. */
export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end()
    _pool = null
  }
}
