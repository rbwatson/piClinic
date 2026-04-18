/**
 * visitDetail.spec.ts
 * E2E display tests for VisitDetailPage.
 *
 * Navigation strategy: click the View link whose href matches the
 * patientVisitID created in beforeEach. This avoids strict-mode
 * violations when multiple E2E test patients appear on the dashboard.
 */

import { test, expect }               from '@playwright/test'
import { login, logout, uiLogin }     from '../helpers/auth.js'
import { createPatient, createVisit } from '../helpers/api.js'
import { deleteVisit, deletePatient, query } from '../helpers/db.js'
import { uniquePatientID, testPatient, testVisit } from '../fixtures/testData.js'

interface VisitRow {
  patientVisitID:   string
  primaryComplaint: string | null
}

let sessionToken:    string
let clinicPatientID: string
let patientVisitID:  string

test.beforeEach(async ({ page }) => {
  const session   = await login()
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

  await uiLogin(page)
})

test.afterEach(async () => {
  await deleteVisit(patientVisitID)
  await deletePatient(clinicPatientID)
  await logout(sessionToken)
})

/** Click the View link for the visit created in beforeEach and wait for the detail page. */
async function navigateToVisitDetail(page: Parameters<typeof test>[1] extends (args: { page: infer P }) => unknown ? P : never) {
  await page.locator(`a[href="/visits/${patientVisitID}"]`).click()
  await page.waitForURL(`/visits/${patientVisitID}`)
}

test('click view link in dashboard for patient', async ({ page }) => {
  await navigateToVisitDetail(page)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(testPatient.lastName)
})

test('shows patient name on detail page', async ({ page }) => {
  await navigateToVisitDetail(page)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(testPatient.lastName)
})

test('shows primary complaint on detail page', async ({ page }) => {
  await navigateToVisitDetail(page)
  await expect(
    page.locator('div.label-value').filter({ hasText: testVisit.primaryComplaint })
  ).toBeVisible()
})

test('shows visit ID on detail page', async ({ page }) => {
  await navigateToVisitDetail(page)
  await expect(page.getByText(patientVisitID)).toBeVisible()
})

test('shows open status for open visit', async ({ page }) => {
  await navigateToVisitDetail(page)
  await expect(
    page.locator('div.label-value').filter({ hasText: 'Open' })
  ).toBeVisible()
})

test('data in DB matches what was created via API', async () => {
  const rows = await query<VisitRow>(
    'SELECT patientVisitID, primaryComplaint FROM visit WHERE patientVisitID = ?',
    [patientVisitID]
  )
  expect(rows).toHaveLength(1)
  expect(rows[0].primaryComplaint).toBe(testVisit.primaryComplaint)
})
