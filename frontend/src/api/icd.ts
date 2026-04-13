/**
 * icd.ts
 * React Query hooks and API calls for ICD-10 code resources.
 *
 * Endpoint: GET /api/v2/icd (bare array, no envelope)
 * Search params (at least one required):
 *   q         — code or description text (used by autocomplete)
 *   t         — description text only
 *   c         — code prefix only
 *   language  — 'en' | 'es' (defaults to 'en')
 *   sort      — 'c' (code), 't' (description), 'd' (last used date)
 *
 * Pi note: description search (~195ms on Pi 3B+). Debounce is handled
 * in the ICD10Autocomplete component, not here.
 */

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface IcdCode {
  language:         string
  icd10code:        string
  icd10index:       string
  shortDescription: string | null
  useCount:         number
  lastUsedDate:     string | null
}

export interface IcdSearchParams {
  q?:        string
  t?:        string
  c?:        string
  language?: 'en' | 'es'
  sort?:     'c' | 't' | 'd'
}

export async function searchIcdCodes(params: IcdSearchParams): Promise<IcdCode[]> {
  const response = await api.get<IcdCode[]>('/icd', { params })
  return response.data
}

export function useIcdSearch(params: IcdSearchParams) {
  const hasParam = !!(params.q || params.t || params.c)
  return useQuery({
    queryKey: ['icd', 'search', params],
    queryFn:  () => searchIcdCodes(params),
    enabled:  hasParam,
    // Cache results aggressively — ICD-10 codes don't change
    staleTime: 5 * 60 * 1000,
  })
}
