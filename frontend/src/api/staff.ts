/**
 * staff.ts
 * React Query hooks and API calls for staff resources.
 *
 * Endpoint: GET /api/v2/staff (bare array, no envelope)
 * Params:
 *   active   — '1' | '0'
 *   position — filter by position enum value
 *
 * medicalStaff field: 1 if clinical position, 0 if ClinicStaff/Other.
 * The visit form dropdown filters to medicalStaff === 1 client-side.
 */

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface StaffMember {
  memberID:               string | null
  username:               string
  lastName:               string
  firstName:              string
  position:               string
  medicalStaff:           number
  preferredLanguage:      string | null
  preferredClinicPublicID: string | null
  contactInfo:            string | null
  altContactInfo:         string | null
  active:                 number
  accessGranted:          string
  lastLogin:              string | null
  modifiedDate:           string | null
  createdDate:            string | null
}

export function staffDisplayName(s: Pick<StaffMember, 'firstName' | 'lastName'>): string {
  return `${s.firstName} ${s.lastName}`.trim()
}

async function fetchActiveStaff(): Promise<StaffMember[]> {
  const response = await api.get<StaffMember[]>('/staff', { params: { active: '1' } })
  return response.data
}

export function useActiveStaff() {
  return useQuery({
    queryKey: ['staff', 'active'],
    queryFn:  fetchActiveStaff,
    // Staff list changes infrequently — cache for 5 minutes
    staleTime: 5 * 60 * 1000,
  })
}

// Returns only staff with clinical positions for the visit form dropdown
export function useMedicalStaff() {
  const query = useActiveStaff()
  return {
    ...query,
    data: query.data?.filter((s) => s.medicalStaff === 1) ?? [],
  }
}
