/**
 * visitDetail.spec.ts
 * E2E display tests for VisitDetailPage.
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
  page.on('response', res => {
    if (res.url().includes('/auth/')) {
      console.log('AUTH RESPONSE:', res.status(), res.url())
    }
  })
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
  console.log ('visit created with primary complaint of: ', visit.primaryComplaint)

  await uiLogin(page)
})

test.afterEach(async () => {
  await deleteVisit(patientVisitID)
  await deletePatient(clinicPatientID)
  await logout(sessionToken)
})

const testNameX1= 'click view link in dashboard for patient'
test (testNameX1, async({ page}) => {
  console.log('TEST: ', testNameX1)  
  await page.locator('tr')
  .filter({ hasText: 'Runner E2ETest' })
  .getByRole('link', { name: 'View' })
  .click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(testPatient.lastName)
})

const testName1= 'shows patient name on detail page'
test(testName1, async ({ page }) => {
  console.log('TEST: ', testName1)
  await page.locator('tr')
  .filter({ hasText: 'Runner E2ETest' })
  .getByRole('link', { name: 'View' })
  .click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(testPatient.lastName)
})

const testName2 = 'shows primary complaint on detail page'
test(testName2, async ({ page }) => {
  console.log('TEST: ', testName2)
  await page.locator('tr')
  .filter({ hasText: 'Runner E2ETest' })
  .getByRole('link', { name: 'View' })
  .click();
  await expect((page.locator('div.label-value')
  .filter({hasText: 'Primary reason for visit'}).filter({hasText: testVisit.primaryComplaint}))).toBeVisible()
})

const testName3 = 'shows visit ID on detail page'
test(testName3, async ({ page }) => {
  console.log('TEST: ', testName3)
  await page.locator('tr')
  .filter({ hasText: 'Runner E2ETest' })
  .getByRole('link', { name: 'View' })
  .click();
  await expect(page.getByText(patientVisitID)).toBeVisible()
})

const testName4 = 'shows admitted status for open visit'
test(testName4, async ({ page }) => {
  console.log('TEST: ', testName4)
  await page.locator('tr')
  .filter({ hasText: 'Runner E2ETest' })
  .getByRole('link', { name: 'View' })
  .click();
  await expect((page.locator('div.label-value')
  .filter({hasText: 'Status'}).filter({hasText: 'Admitted'}))).toBeVisible()
})

const testName5 = 'data in DB matches what was created via API'
test(testName5, async () => {
  const sqlStatement = 'SELECT patientVisitID, primaryComplaint FROM visit WHERE patientVisitID = ' + patientVisitID
  console.log('TEST: ', testName5, 'QUERY: ', sqlStatement)
  const rows = await query<VisitRow>( sqlStatement )
  if (rows.length > 0) {
    console.log( ' QUERY RESULT: ', JSON.stringify(rows) )
  }
  expect(rows).toHaveLength(1)
  expect(rows[0].primaryComplaint).toBe(testVisit.primaryComplaint)
})
