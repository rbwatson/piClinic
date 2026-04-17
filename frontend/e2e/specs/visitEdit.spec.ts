/**
 * visitEdit.spec.ts
 * E2E round-trip tests for VisitEditPage.
 */

import { test, expect }               from '@playwright/test'
import { login, logout }              from '../helpers/auth.js'
import { createPatient, createVisit } from '../helpers/api.js'
import { deleteVisit, deletePatient, query } from '../helpers/db.js'
import { uniquePatientID, testPatient, testVisit, testDiagnosis } from '../fixtures/testData.js'

interface VisitRow {
  patientVisitID: string
  diagnosis1:     string | null
  condition1:     string | null
  pulse:          number | null
  bpSystolic:     number | null
  bpDiastolic:    number | null
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

  // Log in via UI using input IDs (stable regardless of i18n language)
  await page.goto('/login')
  await page.locator('#username').fill(process.env.E2E_TEST_USERNAME!)
  await page.locator('#password').fill(process.env.E2E_TEST_PASSWORD!)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('/')
})

test.afterEach(async () => {
  await deleteVisit(patientVisitID)
  await deletePatient(clinicPatientID)
  await logout(sessionToken)
})

test('saves diagnosis code and condition correctly', async ({ page }) => {
  await page.goto(`/visits/${patientVisitID}/edit`)
  await page.waitForSelector('.diagnosis-field')

  // Select condition (New diagnosis)
  await page.locator('.diagnosis-field').first()
    .locator('.diagnosis-condition-select').selectOption('NEWDIAG')

  // Type ICD code in autocomplete
  const icdInput = page.locator('.diagnosis-field').first()
    .locator('input[role="combobox"]')
  await icdInput.fill(testDiagnosis.code)

  // Wait for and click the matching result
  await page.waitForSelector('ul[role="listbox"]')
  await page.locator('ul[role="listbox"] li').first().click()

  // Submit
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(`/visits/${patientVisitID}`)

  // --- DB verification ---
  const rows = await query<VisitRow>(
    'SELECT patientVisitID, diagnosis1, condition1 FROM visit WHERE patientVisitID = ?',
    [patientVisitID]
  )
  expect(rows).toHaveLength(1)
  expect(rows[0].diagnosis1).toBe(testDiagnosis.code)
  expect(rows[0].condition1).toBe(testDiagnosis.condition)
})

test('saves vitals correctly', async ({ page }) => {
  await page.goto(`/visits/${patientVisitID}/edit`)
  await page.waitForSelector('.vitals-edit-grid')

  await page.locator('input[name="pulse"]').fill('72')
  await page.locator('input[name="bpSystolic"]').fill('120')
  await page.locator('input[name="bpDiastolic"]').fill('79')

  await page.locator('button[type="submit"]').click()
  await page.waitForURL(`/visits/${patientVisitID}`)

  // --- DB verification ---
  const rows = await query<VisitRow>(
    'SELECT pulse, bpSystolic, bpDiastolic FROM visit WHERE patientVisitID = ?',
    [patientVisitID]
  )
  expect(rows).toHaveLength(1)
  expect(Number(rows[0].pulse)).toBe(72)
  expect(Number(rows[0].bpSystolic)).toBe(120)
  expect(Number(rows[0].bpDiastolic)).toBe(79)
})

test('detail page shows ICD code with description after save', async ({ page }) => {
  await page.goto(`/visits/${patientVisitID}/edit`)
  await page.waitForSelector('.diagnosis-field')

  await page.locator('.diagnosis-field').first()
    .locator('.diagnosis-condition-select').selectOption('NEWDIAG')

  const icdInput = page.locator('.diagnosis-field').first()
    .locator('input[role="combobox"]')
  await icdInput.fill(testDiagnosis.code)
  await page.waitForSelector('ul[role="listbox"]')
  await page.locator('ul[role="listbox"] li').first().click()

  await page.locator('button[type="submit"]').click()
  await page.waitForURL(`/visits/${patientVisitID}`)

  // Detail page should show the composite code + description string
  await expect(page.getByText(new RegExp(testDiagnosis.code))).toBeVisible()
  await expect(page.getByText(new RegExp(testDiagnosis.description))).toBeVisible()
})
