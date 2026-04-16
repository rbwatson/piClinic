/**
 * env.ts
 * Loads and validates E2E environment variables from frontend/e2e/.env.e2e.
 * Throws clearly if any required variable is missing so tests fail fast.
 */

import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(import.meta.dirname, '../.env.e2e') })

function require(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`E2E config error: ${name} is not set in e2e/.env.e2e`)
  return val
}

export const env = {
  baseUrl:      require('E2E_BASE_URL'),
  db: {
    host:       require('E2E_DB_HOST'),
    port:       parseInt(process.env.E2E_DB_PORT ?? '3306', 10),
    database:   require('E2E_DB_NAME'),
    user:       require('E2E_DB_USER'),
    password:   require('E2E_DB_PASSWORD'),
  },
  test: {
    username:   require('E2E_TEST_USERNAME'),
    password:   require('E2E_TEST_PASSWORD'),
  },
}
