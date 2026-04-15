/**
 * CurrentVisitBanner.test.tsx
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CurrentVisitBanner from '@/components/CurrentVisitBanner'
import type { Visit } from '@/api/visits'

const MOCK_VISIT: Partial<Visit> & Pick<Visit,
  'patientVisitID' | 'clinicPatientID' | 'dateTimeIn' | 'staffName' | 'primaryComplaint'
> = {
  patientVisitID:   '0000000000802022061802',
  clinicPatientID:  'PT-GEN-000080',
  dateTimeIn:       '2022-06-18 12:04:00',
  staffName:        'Corral, Test',
  primaryComplaint: 'Annual visit',
} as Visit

function renderBanner(visit = MOCK_VISIT as Visit) {
  return render(
    <MemoryRouter>
      <CurrentVisitBanner visit={visit} />
    </MemoryRouter>
  )
}

describe('CurrentVisitBanner', () => {
  it('renders the heading', () => {
    renderBanner()
    expect(screen.getByRole('heading', { level: 2, name: 'VISIT_CURRENT_HEADING' })).toBeInTheDocument()
  })

  it('renders the doctor name', () => {
    renderBanner()
    expect(screen.getByText('Corral, Test')).toBeInTheDocument()
  })

  it('renders the primary complaint', () => {
    renderBanner()
    expect(screen.getByText('Annual visit')).toBeInTheDocument()
  })

  it('renders the View action link', () => {
    renderBanner()
    expect(screen.getByRole('link', { name: 'ACTION_VIEW' })).toHaveAttribute(
      'href', '/visits/0000000000802022061802'
    )
  })

  it('renders the Edit action link', () => {
    renderBanner()
    expect(screen.getByRole('link', { name: 'ACTION_EDIT' })).toHaveAttribute(
      'href', '/visits/0000000000802022061802/edit'
    )
  })

  it('renders the Discharge action link', () => {
    renderBanner()
    expect(screen.getByRole('link', { name: 'ACTION_DISCHARGE' })).toHaveAttribute(
      'href', '/visits/0000000000802022061802/close'
    )
  })

  it('renders em dash for null doctor', () => {
    const visit = { ...MOCK_VISIT, staffName: null } as Visit
    renderBanner(visit)
    expect(screen.getByText('\u2014')).toBeInTheDocument()
  })
})
