/**
 * patients.ts
 * React Query hooks and API calls for patient resources.
 *
 * Endpoint notes (from PatientController):
 *   GET  /patients?q=...                   -> Patient[]  (bare array, no envelope)
 *   GET  /patients/{clinicPatientID}       -> Patient    (bare object, no envelope)
 *   POST /patients                         -> { status, data: Patient }
 *   PATCH /patients/{clinicPatientID}      -> Patient    (bare object, no envelope)
 */

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

// ---------------------------------------------------------------------------
// Types (mirrors Patient model toArray() output)
// ---------------------------------------------------------------------------

export interface Patient {
  clinicPatientID:    string
  patientNationalID:  string | null
  familyID:           string | null
  lastName:           string
  lastName2:          string | null
  firstName:          string
  middleInitial:      string | null
  sex:                'M' | 'F' | 'X'
  birthDate:          string | null
  nextVaccinationDate: string | null
  homeAddress1:       string | null
  homeAddress2:       string | null
  homeNeighborhood:   string | null
  homeCity:           string | null
  homeCounty:         string | null
  homeState:          string | null
  contactPhone:       string | null
  contactAltPhone:    string | null
  bloodType:          string | null
  organDonor:         number | null
  preferredLanguage:  string | null
  knownAllergies:     string | null
  currentMedications: string | null
  responsibleParty:   string | null
  maritalStatus:      string | null
  profession:         string | null
}

// Helper: build display name from patient fields
export function patientDisplayName(p: Pick<Patient, 'firstName' | 'lastName' | 'lastName2' | 'middleInitial'>): string {
  const parts = [
    p.firstName,
    p.middleInitial ?? '',
    p.lastName,
    p.lastName2 ?? '',
  ].filter(Boolean)
  return parts.join(' ')
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function searchPatients(q: string): Promise<Patient[]> {
  const response = await api.get<Patient[]>('/patients', { params: { q } })
  return response.data
}

export async function fetchPatient(clinicPatientID: string): Promise<Patient> {
  const response = await api.get<Patient>(`/patients/${clinicPatientID}`)
  return response.data
}

export async function createPatient(data: Partial<Patient>): Promise<Patient> {
  const response = await api.post<{ status: string; data: Patient }>('/patients', data)
  return response.data.data
}

export async function updatePatient(
  clinicPatientID: string,
  data: Partial<Patient>
): Promise<Patient> {
  const response = await api.patch<Patient>(`/patients/${clinicPatientID}`, data)
  return response.data
}

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

export function usePatientSearch(q: string) {
  return useQuery({
    queryKey: ['patients', 'search', q],
    queryFn: () => searchPatients(q),
    enabled: q.length >= 2,
  })
}

export function usePatient(clinicPatientID: string) {
  return useQuery({
    queryKey: ['patients', clinicPatientID],
    queryFn: () => fetchPatient(clinicPatientID),
    enabled: !!clinicPatientID,
  })
}
