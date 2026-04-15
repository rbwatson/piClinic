/**
 * NameBlock.test.tsx
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NameBlock from '@/components/NameBlock'

const BASE_PROPS = {
  patientName: 'Alpha Benchmark',
  patientSex:  'M',
  patientDOB:  '2001-07-21',
  patientID:   'PT-GEN-000001',
  visitDate:   '4/12/2026, 12:55 PM',
  visitID:     '0000000099012026041203',
}

function renderBlock(props = BASE_PROPS) {
  return render(
    <MemoryRouter>
      <NameBlock {...props} />
    </MemoryRouter>
  )
}

describe('NameBlock', () => {
  it('renders patient name as h1', () => {
    renderBlock()
    expect(screen.getByRole('heading', { level: 1, name: /Alpha Benchmark/ })).toBeInTheDocument()
  })

  it('renders patient sex', () => {
    renderBlock()
    expect(screen.getByText('(M)')).toBeInTheDocument()
  })

  it('renders patient DOB', () => {
    renderBlock()
    expect(screen.getByText(/2001-07-21/)).toBeInTheDocument()
  })

  it('renders patient ID as a link to the patient detail page', () => {
    renderBlock()
    const link = screen.getByRole('link', { name: 'PT-GEN-000001' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/patients/PT-GEN-000001')
  })

  it('renders visit date', () => {
    renderBlock()
    expect(screen.getByText(/4\/12\/2026/)).toBeInTheDocument()
  })

  it('renders visit ID when provided', () => {
    renderBlock()
    expect(screen.getByText('0000000099012026041203')).toBeInTheDocument()
  })

  it('omits visit ID when not provided', () => {
    const props = { ...BASE_PROPS, visitID: undefined }
    renderBlock(props)
    expect(screen.queryByText('0000000099012026041203')).not.toBeInTheDocument()
  })

  it('omits right block entirely when visitDate is null', () => {
    const props = { ...BASE_PROPS, visitDate: null, visitID: null }
    renderBlock(props)
    expect(screen.queryByText(/VISIT_DATE_LABEL/)).not.toBeInTheDocument()
  })

  it('omits DOB when null', () => {
    const props = { ...BASE_PROPS, patientDOB: null }
    renderBlock(props)
    expect(screen.queryByText(/2001-07-21/)).not.toBeInTheDocument()
  })
})
