/**
 * visits.ts
 * React Query hooks and API calls for visit resources.
 *
 * Endpoint notes (from VisitController + VisitService):
 *   GET  /visits?visitStatus=Open          -> Visit[]  (bare array, no envelope)
 *   GET  /visits?clinicPatientID=X         -> Visit[]  (bare array, no envelope)
 *   GET  /visits/{patientVisitID}          -> Visit    (bare object, no envelope)
 *   POST /visits                           -> { status, data: Visit }
 *   PATCH /visits/{patientVisitID}         -> Visit    (bare object, no envelope)
 *
 * The search endpoint requires at least one of: clinicPatientID or visitStatus.
 */

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

// ---------------------------------------------------------------------------
// Types (mirrors Visit model toArray() output)
// ---------------------------------------------------------------------------

export interface Visit {
  patientVisitID:            string
  clinicPatientID:           string
  firstVisit:                'YES' | 'NO'
  patientNationalID:         string | null
  patientFamilyID:           string | null
  staffName:                 string | null
  staffUsername:             string | null
  staffPosition:             string | null
  visitType:                 string
  visitStatus:               'Open' | 'Closed' | 'Deleted'
  primaryComplaint:          string | null
  secondaryComplaint:        string | null
  dateTimeIn:                string | null
  dateTimeOut:               string | null
  payment:                   string | null
  patientLastName:           string
  patientFirstName:          string
  patientSex:                'M' | 'F' | 'X'
  patientBirthDate:          string | null
  patientHomeAddress1:       string | null
  patientHomeAddress2:       string | null
  patientHomeNeighborhood:   string | null
  patientHomeCity:           string | null
  patientHomeCounty:         string | null
  patientHomeState:          string | null
  patientContactPhone:       string | null
  patientContactAltPhone:    string | null
  patientKnownAllergies:     string | null
  patientCurrentMedications: string | null
  patientNextVaccinationDate: string | null
  patientResponsibleParty:   string | null
  patientMaritalStatus:      string | null
  patientProfession:         string | null
  height:      number | null
  heightUnits: string | null
  weight:      number | null
  weightUnits: string | null
  temp:        number | null
  tempUnits:   string | null
  bpSystolic:  number | null
  bpDiastolic: number | null
  pulse:       number | null
  glucose:     number | null
  glucoseUnits: string | null
  diagnosis1:  string | null
  condition1:  string | null
  diagnosis2:  string | null
  condition2:  string | null
  diagnosis3:  string | null
  condition3:  string | null
  referredTo:  string | null
  referredFrom: string | null
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function fetchOpenVisits(): Promise<Visit[]> {
  const response = await api.get<Visit[]>('/visits', {
    params: { visitStatus: 'Open' },
  })
  return response.data
}

export async function fetchVisitsByPatient(
  clinicPatientID: string,
  visitStatus?: string
): Promise<Visit[]> {
  const response = await api.get<Visit[]>('/visits', {
    params: {
      clinicPatientID,
      ...(visitStatus ? { visitStatus } : {}),
    },
  })
  return response.data
}

export async function fetchVisit(patientVisitID: string): Promise<Visit> {
  const response = await api.get<Visit>(`/visits/${patientVisitID}`)
  return response.data
}

export async function createVisit(
  data: Partial<Visit> & { clinicPatientID: string; visitType: string }
): Promise<Visit> {
  const response = await api.post<{ status: string; data: Visit }>('/visits', data)
  return response.data.data
}

export async function updateVisit(
  patientVisitID: string,
  data: Partial<Visit>
): Promise<Visit> {
  const response = await api.patch<Visit>(`/visits/${patientVisitID}`, data)
  return response.data
}

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

export function useOpenVisits() {
  return useQuery({
    queryKey: ['visits', 'open'],
    queryFn: fetchOpenVisits,
    // Refresh open visits every 60 seconds — patients arrive throughout the day
    refetchInterval: 60_000,
  })
}

export function useVisitsByPatient(
  clinicPatientID: string,
  visitStatus?: string
) {
  return useQuery({
    queryKey: ['visits', 'patient', clinicPatientID, visitStatus],
    queryFn: () => fetchVisitsByPatient(clinicPatientID, visitStatus),
    enabled: !!clinicPatientID,
  })
}

export function useVisit(patientVisitID: string) {
  return useQuery({
    queryKey: ['visits', patientVisitID],
    queryFn: () => fetchVisit(patientVisitID),
    enabled: !!patientVisitID,
  })
}
