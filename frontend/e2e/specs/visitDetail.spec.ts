/**
 * visitDetail.spec.ts
 * E2E display tests for VisitDetailPage.
 *
 * Verifies that data written directly to the DB (or via the API)
 * is displayed correctly on the read-only detail page.
 */

import { test, expect } from '@playwright/test'
import { login, logout }              from '../helpers/auth.js'
import { createPatient, createVisit } from '../helpers/api.js'
import { deleteVisit, deletePatient, query } from '../helpers/db.js'
import { uniquePatientID, testPatient, testVisit } from '../fixtures/testData.js'

interface VisitRow {
  patientVisitID:  string
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

  await page.goto('/login')
  await page.getByLabel('LOGIN_USERNAME').fill(process.env.E2E_TEST_USERNAME!)
  await page.getByLabel('LOGIN_PASSWORD').fill(process.env.E2E_TEST_PASSWORD!)
  await page.getByRole('button', { name: 'LOGIN_SUBMIT' }).click()
  await page.waitForURL('/')
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
  await expect(page.getByText('VISIT_STATUS_OPEN')).toBeVisible()
})

test('data in DB matches what was created via API', async () => {
  const rows = await query<VisitRow>(
    'SELECT patientVisitID, primaryComplaint FROM visit WHERE patientVisitID = ?',
    [patientVisitID]
  )
  expect(rows).toHaveLength(1)
  expect(rows[0].primaryComplaint).toBe(testVisit.primaryComplaint)
})
