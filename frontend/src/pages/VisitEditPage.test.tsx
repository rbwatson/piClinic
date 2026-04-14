/**
 * VisitEditPage.test.tsx
 *
 * Component tests for VisitEditPage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import VisitEditPage from '@/pages/VisitEditPage'
import * as visitsApi from '@/api/visits'
import * as staffApi from '@/api/staff'

const MOCK_VISIT: visitsApi.Visit = {
  patientVisitID:    '000000000001202604010101',
  clinicPatientID:   'PT-GEN-000001',
  firstVisit:        'NO',
  patientNationalID: null,
  patientFamilyID:   null,
  staffName:         'Test Doctor',
  staffUsername:     'Verduzco',
  staffPosition:     'DoctorGeneral',
  visitType:         'Outpatient',
  visitStatus:       'Open',
  primaryComplaint:  'Fever',
  secondaryComplaint: null,
  dateTimeIn:        '2026-04-13 09:00:00',
  dateTimeOut:       null,
  payment:           null,
  patientLastName:   'Fernández',
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

function renderEditPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/visits/000000000001202604010101/edit']}>
        <Routes>
          <Route path="/visits/:id/edit" element={<VisitEditPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('VisitEditPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(staffApi, 'useActiveStaff').mockReturnValue({
      data: [], isLoading: false, isError: false,
    } as unknown as ReturnType<typeof staffApi.useActiveStaff>)
  })

  it('shows loading state while visit is fetching', () => {
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: undefined, isLoading: true, isError: false,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    renderEditPage()
    expect(screen.getByText('LOADING')).toBeInTheDocument()
  })

  it('shows error when visit is not found', () => {
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: undefined, isLoading: false, isError: true,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    renderEditPage()
    expect(screen.getByText('ERROR_NOT_FOUND')).toBeInTheDocument()
  })

  it('shows patient name in the nameBlock heading', async () => {
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: MOCK_VISIT, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    renderEditPage()
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Yamel')
      expect(screen.getByText('PT-GEN-000001')).toBeInTheDocument()
    })
  })

  it('shows the cancel link back to visit detail', async () => {
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: MOCK_VISIT, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    renderEditPage()
    await waitFor(() => {
      expect(screen.getByText('VISIT_CANCEL')).toBeInTheDocument()
    })
  })

  it('shows the save button', async () => {
    vi.spyOn(visitsApi, 'useVisit').mockReturnValue({
      data: MOCK_VISIT, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof visitsApi.useVisit>)
    renderEditPage()
    await waitFor(() => {
      expect(screen.getByText('VISIT_EDIT_ACTION')).toBeInTheDocument()
    })
  })
})
