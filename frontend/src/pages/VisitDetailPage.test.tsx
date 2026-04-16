/**
 * VisitDetailPage.test.tsx
 *
 * Component tests for VisitDetailPage.
 * Updated for pattern-composition rebuild and ICD lookup.
 *
 * Field mapping (corrected):
 *   diagnosis{n}  — ICD code string (e.g. 'J06.9')
 *   condition{n}  — New/Subsequent classifier ('NEWDIAG' | 'SUBSDIAG')
 *   Description   — fetched from ICD API by code at display time
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import VisitDetailPage from '@/pages/VisitDetailPage'
import * as visitsApi from '@/api/visits'
import * as icdApi from '@/api/icd'

const BASE_VISIT: visitsApi.Visit = {
  patientVisitID:    '000000000001202604010101',
  clinicPatientID:   'PT-GEN-000001',
  firstVisit:        'NO',
  patientNationalID: null,
  patientFamilyID:   null,
  staffName:         'Dr. Verduzco',
  staffUsername:     'Verduzco',
  staffPosition:     'DoctorGeneral',
  visitType:         'Outpatient',
  visitStatus:       'Open',
  primaryComplaint:  'Fever',
  secondaryComplaint: null,
  dateTimeIn:        '2026-04-13 09:00:00',
  dateTimeOut:       null,
  payment:           null,
  patientLastName:   'Fern\u00e1ndez',
  patientFirstName:  'Yamel',
  patientSex:        'F',
  patientBirthDate:  '2001-07-21',
  patientHomeAddress1: null, patientHomeAddress2: null,
  patientHomeNeighborhood: null, patientHomeCity: null,
  patientHomeCounty: null, patientHomeState: null,
  patientContactPhone: null, patientContactAltPhone: null,
  patientKnownAllergies: null, patientCurrentMedications: null,
  patientNextVaccinationDate: null, patientResponsibleParty: null,
  patientMaritalStatus: null, patientProfession: null,
  height: null, heightUnits: null,
  weight: null, weightUnits: null,
  temp: null, tempUnits: null,
  bpSystolic: null, bpDiastolic: null,
  pulse: null, glucose: null, glucoseUnits: null,
  diagnosis1: null, condition1: null,
  diagnosis2: null, condition2: null,
  diagnosis3: null, condition3: null,
  referredTo: null, referredFrom: null,
}

// Default ICD hook mock — returns no data (disabled query)
function mockIcdNoData() {
  vi.spyOn(icdApi, 'useIcdDescription').mockReturnValue({
    data: undefined, isLoading: false, isError: false,
  } as unknown as ReturnType<typeof icdApi.useIcdDescription>)
}

function renderDetailPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/visits/000000000001202604010101']}>
        <Routes>
          <Route path="/visits/:id" element={<VisitDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('VisitDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockIcdNoData()
  })

  it('shows loading state', () => {
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: undefined, isLoading: true, isError: false,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    renderDetailPage()
    expect(screen.getByText('LOADING')).toBeInTheDocument()
  })

  it('shows error when visit not found', () => {
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: undefined, isLoading: false, isError: true,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    renderDetailPage()
    expect(screen.getByText('ERROR_NOT_FOUND')).toBeInTheDocument()
  })

  it('shows patient name in h1', async () => {
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: BASE_VISIT, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    renderDetailPage()
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Yamel')
    })
  })

  it('shows patient ID as a link', async () => {
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: BASE_VISIT, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    renderDetailPage()
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'PT-GEN-000001' })).toBeInTheDocument()
    })
  })

  it('shows open status for open visits', async () => {
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: BASE_VISIT, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    renderDetailPage()
    await waitFor(() => {
      expect(screen.getByText('VISIT_STATUS_OPEN')).toBeInTheDocument()
    })
  })

  it('shows Edit and Discharge action links for open visits', async () => {
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: BASE_VISIT, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    renderDetailPage()
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'VISIT_EDIT_ACTION' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'VISIT_CLOSE_ACTION' })).toBeInTheDocument()
    })
  })

  it('does not show Edit/Discharge links for closed visits', async () => {
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: { ...BASE_VISIT, visitStatus: 'Closed', dateTimeOut: '2026-04-13 11:00:00' },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    renderDetailPage()
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'VISIT_EDIT_ACTION' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'VISIT_CLOSE_ACTION' })).not.toBeInTheDocument()
    })
  })

  it('always shows pre-clinic vitals section', async () => {
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: BASE_VISIT, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    renderDetailPage()
    await waitFor(() => {
      expect(screen.getByText('VISIT_PRECLINIC_HEADING')).toBeInTheDocument()
    })
  })

  it('renders vital values when present', async () => {
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: { ...BASE_VISIT, pulse: 72, bpSystolic: 120, bpDiastolic: 79 },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    renderDetailPage()
    await waitFor(() => {
      expect(screen.getByText('72')).toBeInTheDocument()
      expect(screen.getByText('120/79')).toBeInTheDocument()
    })
  })

  it('shows ICD code with description when diagnosis is present', async () => {
    // diagnosis1 holds the ICD code; description comes from useIcdDescription mock
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: { ...BASE_VISIT, diagnosis1: 'J06.9', condition1: 'NEWDIAG' },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    vi.spyOn(icdApi, 'useIcdDescription').mockReturnValue({
      data: { icd10code: 'J06.9', shortDescription: 'Acute upper respiratory infection',
              language: 'en', icd10index: '', useCount: 0, lastUsedDate: null },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof icdApi.useIcdDescription>)
    renderDetailPage()
    await waitFor(() => {
      // Code and description are rendered together in a single span
      expect(screen.getByText(/J06\.9/)).toBeInTheDocument()
      expect(screen.getByText(/Acute upper respiratory infection/)).toBeInTheDocument()
    })
  })

  it('shows just the code when ICD lookup returns no result', async () => {
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: { ...BASE_VISIT, diagnosis1: 'J06.9', condition1: 'NEWDIAG' },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    // ICD hook returns no data (code not in table)
    vi.spyOn(icdApi, 'useIcdDescription').mockReturnValue({
      data: undefined, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof icdApi.useIcdDescription>)
    renderDetailPage()
    await waitFor(() => {
      expect(screen.getByText('J06.9')).toBeInTheDocument()
    })
  })

  it('shows diagnoses heading', async () => {
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: BASE_VISIT, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    renderDetailPage()
    await waitFor(() => {
      expect(screen.getByText('VISIT_DIAGNOSES_HEADING')).toBeInTheDocument()
    })
  })
})