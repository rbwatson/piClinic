/**
 * testData.ts
 * Canonical fixture values used across E2E tests.
 *
 * Patient IDs use the PT-E2E- prefix so stale records from aborted
 * test runs are easy to identify and clean up manually.
 *
 * Each test generates a unique suffix using Date.now() + random digits
 * to avoid collisions when tests run concurrently or in quick succession.
 */

export function uniquePatientID(): string {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`
  return `PT-E2E-${suffix}`
}

export const testPatient = {
  lastName:  'E2ETest',
  firstName: 'Runner',
  sex:       'F' as const,
  // homeState is NOT NULL in the DB — provide an empty string as placeholder
  homeState: 'State',
  homeCity:  'City',
  homeCounty: 'County',
}

export const testVisit = {
  visitType:        'Outpatient',
  primaryComplaint: 'E2E test complaint',
}

/**
 * Known ICD-10 code used in diagnosis tests.
 * G44.3 — Post-traumatic headache (present in standard ICD-10 table).
 */
export const testDiagnosis = {
  code:        'G44.3',
  condition:   'NEWDIAG',
  description: 'Post-traumatic headache',
}
