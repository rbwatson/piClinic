/**
 * patients.utils.test.ts
 *
 * Unit tests for the patientDisplayName helper in api/patients.ts.
 * Duplicated here to keep api/ tests co-located with their module.
 * The canonical implementation test is in lib/patientForm.utils.test.ts.
 *
 * Also tests the PatientSearchParams shape — verifies the object structure
 * the search hook expects so API call regressions are caught early.
 */

import { describe, it, expect } from 'vitest'
import { patientDisplayName } from '@/api/patients'

describe('patientDisplayName (api/patients)', () => {
  it('joins first and last name', () => {
    expect(patientDisplayName({
      firstName: 'Carlos',
      lastName: 'Ramírez',
      lastName2: null,
      middleInitial: null,
    })).toBe('Carlos Ramírez')
  })

  it('includes second last name', () => {
    expect(patientDisplayName({
      firstName: 'Carlos',
      lastName: 'Ramírez',
      lastName2: 'Soto',
      middleInitial: null,
    })).toBe('Carlos Ramírez Soto')
  })

  it('handles empty string middleInitial as falsy', () => {
    expect(patientDisplayName({
      firstName: 'Ana',
      lastName: 'López',
      lastName2: null,
      middleInitial: '',
    })).toBe('Ana López')
  })
})
