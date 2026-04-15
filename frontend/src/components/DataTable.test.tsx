/**
 * DataTable.test.tsx
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DataTable from '@/components/DataTable'

const COLUMNS = [
  { key: 'name',    heading: 'Patient name', nowrap: true },
  { key: 'arrived', heading: 'Admitted to clinic' },
  { key: 'doctor',  heading: 'Doctor' },
  { key: 'actions', heading: 'Actions', align: 'right' as const },
]

const ROWS = [
  { name: 'Alpha Benchmark', arrived: '12:55 PM', doctor: 'Dr. Smith', actions: 'View' },
  { name: 'Beta Patient',    arrived: '1:00 PM',  doctor: null,         actions: 'View' },
]

function renderTable(rows = ROWS) {
  return render(
    <MemoryRouter>
      <DataTable columns={COLUMNS} rows={rows} />
    </MemoryRouter>
  )
}

describe('DataTable', () => {
  it('renders column headings', () => {
    renderTable()
    expect(screen.getByText('Patient name')).toBeInTheDocument()
    expect(screen.getByText('Admitted to clinic')).toBeInTheDocument()
    expect(screen.getByText('Doctor')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('renders row data', () => {
    renderTable()
    expect(screen.getByText('Alpha Benchmark')).toBeInTheDocument()
    expect(screen.getByText('12:55 PM')).toBeInTheDocument()
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
  })

  it('renders em dash and dt-inactive class for null cell value', () => {
    renderTable()
    // Beta Patient has null doctor — should render em dash
    const cells = screen.getAllByText('\u2014')
    expect(cells.length).toBeGreaterThan(0)
    expect(cells[0]).toHaveClass('dt-inactive')
  })

  it('applies dt-nowrap class to nowrap columns', () => {
    renderTable()
    const nameCell = screen.getByText('Alpha Benchmark')
    expect(nameCell).toHaveClass('dt-nowrap')
  })

  it('applies dt-right class to right-aligned columns', () => {
    renderTable()
    // Both th and td for actions column should have dt-right
    const actionHeader = screen.getByText('Actions')
    expect(actionHeader).toHaveClass('dt-right')
  })

  it('renders ReactNode cell content', () => {
    const rows = [{
      name: <a href="/patients/1">Link Patient</a>,
      arrived: '12:00 PM',
      doctor: 'Dr. Jones',
      actions: 'View',
    }]
    renderTable(rows)
    expect(screen.getByRole('link', { name: 'Link Patient' })).toBeInTheDocument()
  })

  it('renders an empty table body without crashing', () => {
    renderTable([])
    expect(screen.getByText('Patient name')).toBeInTheDocument()
    expect(screen.queryByText('Alpha Benchmark')).not.toBeInTheDocument()
  })
})
