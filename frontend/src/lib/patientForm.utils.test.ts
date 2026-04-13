/**
 * patientForm.utils.test.ts
 *
 * Unit tests for the pure utility functions in patientForm.utils.ts.
 * These functions handle the pipe/newline conversion for allergies and
 * medications, patient display name formatting, and role access checks.
 *
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest'
import { pipeToLines, linesToPipe, patientDisplayName, hasRole } from '@/lib/patientForm.utils'

// ---------------------------------------------------------------------------
// pipeToLines
// ---------------------------------------------------------------------------

describe('pipeToLines', () => {
  it('splits a pipe-separated string into newline-separated lines', () => {
    expect(pipeToLines('penicillin|aspirin|ibuprofen')).toBe('penicillin\naspirin\nibuprofen')
  })

  it('returns a single line when there are no pipes', () => {
    expect(pipeToLines('penicillin')).toBe('penicillin')
  })

  it('returns an empty string for null', () => {
    expect(pipeToLines(null)).toBe('')
  })

  it('returns an empty string for undefined', () => {
    expect(pipeToLines(undefined)).toBe('')
  })

  it('returns an empty string for an empty string', () => {
    expect(pipeToLines('')).toBe('')
  })

  it('handles a trailing pipe', () => {
    expect(pipeToLines('penicillin|')).toBe('penicillin\n')
  })
})

// ---------------------------------------------------------------------------
// linesToPipe
// ---------------------------------------------------------------------------

describe('linesToPipe', () => {
  it('joins newline-separated lines into a pipe-separated string', () => {
    expect(linesToPipe('penicillin\naspirin\nibuprofen')).toBe('penicillin|aspirin|ibuprofen')
  })

  it('returns a single value with no pipe when only one line', () => {
    expect(linesToPipe('penicillin')).toBe('penicillin')
  })

  it('returns null for an empty string', () => {
    expect(linesToPipe('')).toBeNull()
  })

  it('returns null for a string of only newlines', () => {
    expect(linesToPipe('\n\n\n')).toBeNull()
  })

  it('filters out blank lines', () => {
    expect(linesToPipe('penicillin\n\n\naspirin')).toBe('penicillin|aspirin')
  })

  it('trims whitespace from each line', () => {
    expect(linesToPipe('  penicillin  \n  aspirin  ')).toBe('penicillin|aspirin')
  })

  it('returns null when all lines are whitespace', () => {
    expect(linesToPipe('   \n   \n   ')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Round-trip: pipeToLines -> linesToPipe
// ---------------------------------------------------------------------------

describe('pipeToLines / linesToPipe round-trip', () => {
  it('restores the original pipe string after a round-trip', () => {
    const original = 'penicillin|tetracycline|ibuprofen|sulfa'
    expect(linesToPipe(pipeToLines(original))).toBe(original)
  })

  it('round-trips a single entry', () => {
    expect(linesToPipe(pipeToLines('penicillin'))).toBe('penicillin')
  })

  it('round-trips null to null', () => {
    expect(linesToPipe(pipeToLines(null))).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// patientDisplayName
// ---------------------------------------------------------------------------

describe('patientDisplayName', () => {
  it('combines first and last name', () => {
    expect(patientDisplayName({
      firstName: 'Jane',
      lastName: 'Smith',
      lastName2: null,
      middleInitial: null,
    })).toBe('Jane Smith')
  })

  it('includes middle initial when present', () => {
    expect(patientDisplayName({
      firstName: 'Jane',
      lastName: 'Smith',
      lastName2: null,
      middleInitial: 'A',
    })).toBe('Jane A Smith')
  })

  it('includes second last name when present', () => {
    expect(patientDisplayName({
      firstName: 'María',
      lastName: 'García',
      lastName2: 'López',
      middleInitial: null,
    })).toBe('María García López')
  })

  it('includes all four fields when all are present', () => {
    expect(patientDisplayName({
      firstName: 'Juan',
      lastName: 'García',
      lastName2: 'Martínez',
      middleInitial: 'R',
    })).toBe('Juan R García Martínez')
  })

  it('does not include extra spaces when optional fields are null', () => {
    const name = patientDisplayName({
      firstName: 'Ana',
      lastName: 'Pérez',
      lastName2: null,
      middleInitial: null,
    })
    expect(name).not.toMatch(/  /)
    expect(name).toBe('Ana Pérez')
  })
})

// ---------------------------------------------------------------------------
// hasRole
// ---------------------------------------------------------------------------

describe('hasRole', () => {
  it('returns true when user role equals the minimum', () => {
    expect(hasRole('ClinicStaff', 'ClinicStaff')).toBe(true)
  })

  it('returns true when user role exceeds the minimum', () => {
    expect(hasRole('SystemAdmin', 'ClinicAdmin')).toBe(true)
    expect(hasRole('ClinicAdmin', 'ClinicStaff')).toBe(true)
    expect(hasRole('SystemAdmin', 'ClinicReadOnly')).toBe(true)
  })

  it('returns false when user role is below the minimum', () => {
    expect(hasRole('ClinicReadOnly', 'ClinicAdmin')).toBe(false)
    expect(hasRole('ClinicStaff', 'SystemAdmin')).toBe(false)
  })

  it('returns false for an unrecognised role', () => {
    expect(hasRole('UnknownRole', 'ClinicStaff')).toBe(false)
  })

  it('returns true when minRole is ClinicReadOnly (lowest level)', () => {
    expect(hasRole('ClinicReadOnly', 'ClinicReadOnly')).toBe(true)
    expect(hasRole('ClinicStaff', 'ClinicReadOnly')).toBe(true)
  })
})
