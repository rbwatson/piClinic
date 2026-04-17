/**
 * visitDetail.spec.ts
 * E2E display tests for VisitDetailPage.
 *
 * Session is injected via cookie from the API login token
 * rather than logging in through the UI — avoids dependency
 * on the UI login form working correctly in the test environment.
 */

import { test, expect }               from '@playwright/test'
import { login, logout }              from '../helpers/auth.js'
import { createPatient, createVisit } from '../helpers/api.js'
import { deleteVisit, deletePatient, query } from '../helpers/db.js'
import { uniquePatientID, testPatient, testVisit } from '../fixtures/testData.js'
import { env } from '../helpers/env.js'

interface VisitRow {
  patientVisitID:   string
  primaryComplaint: string | null
}

let sessionToken:    string
let clinicPatientID: string
let patientVisitID:  string

test.beforeEach(async ({ page }) => {
  const session = await login()
  sessionToken    = session.token
  clinicPatientID = uniquePatientID()

  await createPatient({
    token: sessionToken,
    clinicPatientID,
    ...testPatient,
  })

  const visit = await createVisit({
    token: sessionToken,
    clinicPatientID,
    ...testVisit,
  })
  patientVisitID = visit.patientVisitID

  // Inject session token as cookie so the React app treats us as logged in.
  // This avoids depending on the UI login form in the test environment.
  await page.context().addCookies([{
    name:   'piclinic_session',
    value:  sessionToken,
    domain: new URL(env.baseUrl).hostname,
    path:   '/',
  }])
})

test.afterEach(async () => {
  await deleteVisit(patientVisitID)
  await deletePatient(clinicPatientID)
  await logout(sessionToken)
})

test('shows patient name on detail page', async ({ page }) => {
  await page.goto(`/visits/${patientVisitID}`)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(testPatient.lastName)
})

test('shows primary complaint on detail page', async ({ page }) => {
  await page.goto(`/visits/${patientVisitID}`)
  await expect(page.getByText(testVisit.primaryComplaint)).toBeVisible()
})

test('shows visit ID on detail page', async ({ page }) => {
  await page.goto(`/visits/${patientVisitID}`)
  await expect(page.getByText(patientVisitID)).toBeVisible()
})

test('shows admitted status for open visit', async ({ page }) => {
  await page.goto(`/visits/${patientVisitID}`)
  await expect(page.getByText('Admitted')).toBeVisible()
})

test('data in DB matches what was created via API', async () => {
  const rows = await query<VisitRow>(
    'SELECT patientVisitID, primaryComplaint FROM visit WHERE patientVisitID = ?',
    [patientVisitID]
  )
  expect(rows).toHaveLength(1)
  expect(rows[0].primaryComplaint).toBe(testVisit.primaryComplaint)
})
