/**
 * patientForm.utils.ts
 *
 * Pure utility functions extracted from PatientFormPage.
 * Keeping them in a separate module makes them independently testable
 * without rendering the full form component.
 */

import type { Patient } from '@/api/patients'

/**
 * Convert a pipe-separated DB string to a newline-separated textarea value.
 *
 * @example
 * pipeToLines('penicillin|aspirin') // => 'penicillin\naspirin'
 * pipeToLines(null)                 // => ''
 * pipeToLines('')                   // => ''
 */
export function pipeToLines(value: string | null | undefined): string {
  if (!value) return ''
  return value.split('|').join('\n')
}

/**
 * Convert a newline-separated textarea value to a pipe-separated DB string.
 * Empty lines and whitespace-only lines are filtered out.
 * Returns null if no non-empty lines remain (matches the Patient field type).
 *
 * @example
 * linesToPipe('penicillin\naspirin') // => 'penicillin|aspirin'
 * linesToPipe('penicillin\n\n  \n') // => 'penicillin'
 * linesToPipe('')                    // => null
 * linesToPipe('\n\n')               // => null
 */
export function linesToPipe(value: string): string | null {
  const lines = value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  return lines.length > 0 ? lines.join('|') : null
}

/**
 * Build a display name string from patient name fields.
 * Skips null/empty fields and joins with a single space.
 *
 * @example
 * patientDisplayName({ firstName: 'Jane', lastName: 'Smith', lastName2: null, middleInitial: 'A' })
 * // => 'Jane A Smith'
 */
export function patientDisplayName(
  p: Pick<Patient, 'firstName' | 'lastName' | 'lastName2' | 'middleInitial'>
): string {
  return [p.firstName, p.middleInitial, p.lastName, p.lastName2]
    .filter(Boolean)
    .join(' ')
}

/**
 * Role access level order. Higher number = more access.
 */
const ROLE_ORDER: Record<string, number> = {
  ClinicReadOnly: 0,
  ClinicStaff:    1,
  ClinicAdmin:    2,
  SystemAdmin:    3,
}

/**
 * Returns true if the user's role meets or exceeds the minimum required role.
 *
 * @example
 * hasRole('SystemAdmin', 'ClinicAdmin') // => true
 * hasRole('ClinicReadOnly', 'ClinicAdmin') // => false
 * hasRole('UnknownRole', 'ClinicStaff')   // => false
 */
export function hasRole(userRole: string, minRole: string): boolean {
  return (ROLE_ORDER[userRole] ?? 0) >= (ROLE_ORDER[minRole] ?? 0)
}
