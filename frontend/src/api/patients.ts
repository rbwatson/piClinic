/**
 * patients.ts
 * React Query hooks and API calls for patient resources.
 *
 * Endpoint notes (from PatientController):
 *   GET  /patients?q=...                   -> Patient[]  (bare array, no envelope)
 *   GET  /patients?lastName=...&firstName= -> Patient[]  (bare array, no envelope)
 *   GET  /patients/{clinicPatientID}       -> Patient    (bare object, no envelope)
 *   POST /patients                         -> { status, data: Patient }
 *   PATCH /patients/{clinicPatientID}      -> Patient    (bare object, no envelope)
 *
 * Search params (all optional, at least one required):
 *   q                  free-text across name fields
 *   lastName           filter by last name
 *   firstName          filter by first name
 *   clinicPatientID    filter by clinic patient ID
 *   patientNationalID  filter by national ID
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

// Search params accepted by GET /patients
export interface PatientSearchParams {
  q?:                 string
  lastName?:          string
  firstName?:         string
  lastName2?:         string
  middleInitial?:     string
  clinicPatientID?:   string
  patientNationalID?: string
  familyID?:          string
}

// Helper: build display name from patient fields
export function patientDisplayName(
  p: Pick<Patient, 'firstName' | 'lastName' | 'lastName2' | 'middleInitial'>
): string {
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

export async function searchPatients(params: PatientSearchParams): Promise<Patient[]> {
  const response = await api.get<Patient[]>('/patients', { params })
  return response.data
}

export async function fetchPatient(clinicPatientID: string): Promise<Patient> {
  const response = await api.get<Patient>(`/patients/${encodeURIComponent(clinicPatientID)}`)
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
  const response = await api.patch<Patient>(
    `/patients/${encodeURIComponent(clinicPatientID)}`,
    data
  )
  return response.data
}

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

export function usePatientSearch(params: PatientSearchParams) {
  // Only fire when at least one param has a non-empty value
  const hasParam = Object.values(params).some((v) => v && v.trim() !== '')
  return useQuery({
    queryKey: ['patients', 'search', params],
    queryFn: () => searchPatients(params),
    enabled: hasParam,
  })
}

export function usePatient(clinicPatientID: string) {
  return useQuery({
    queryKey: ['patients', clinicPatientID],
    queryFn: () => fetchPatient(clinicPatientID),
    enabled: !!clinicPatientID,
  })
}
