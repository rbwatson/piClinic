/**
 * VitalsSection.test.tsx
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import VitalsSection, { type VitalsValues } from '@/components/VitalsSection'

// ---------------------------------------------------------------------------
// Display mode
// ---------------------------------------------------------------------------

const FULL_VALUES: VitalsValues = {
  height: 150, heightUnits: 'cm',
  weight: 40,  weightUnits: 'kg',
  temp: 37,    tempUnits: 'C',
  bpSystolic: 120, bpDiastolic: 79,
  pulse: 67,
  glucose: null, glucoseUnits: null,
}

describe('VitalsSection — display mode', () => {
  it('renders all column headings', () => {
    render(<VitalsSection mode="display" values={FULL_VALUES} />)
    expect(screen.getByText('VISIT_HEIGHT_LABEL')).toBeInTheDocument()
    expect(screen.getByText('VISIT_WEIGHT_LABEL')).toBeInTheDocument()
    expect(screen.getByText('VISIT_TEMP_LABEL')).toBeInTheDocument()
    expect(screen.getByText('VISIT_BP_LABEL')).toBeInTheDocument()
    expect(screen.getByText('VISIT_PULSE_LABEL')).toBeInTheDocument()
    expect(screen.getByText('VISIT_GLUCOSE_LABEL')).toBeInTheDocument()
  })

  it('renders formatted vital values', () => {
    render(<VitalsSection mode="display" values={FULL_VALUES} />)
    expect(screen.getByText(/150/)).toBeInTheDocument()
    expect(screen.getByText(/40/)).toBeInTheDocument()
    expect(screen.getByText(/37/)).toBeInTheDocument()
    expect(screen.getByText('120/79')).toBeInTheDocument()
    expect(screen.getByText('67')).toBeInTheDocument()
  })

  it('renders em dash for null glucose', () => {
    render(<VitalsSection mode="display" values={FULL_VALUES} />)
    expect(screen.getByText('\u2014')).toBeInTheDocument()
  })

  it('renders em dash for null bp when bpSystolic is null', () => {
    const values = { ...FULL_VALUES, bpSystolic: null, bpDiastolic: null }
    render(<VitalsSection mode="display" values={values} />)
    const dashes = screen.getAllByText('\u2014')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })
})

// ---------------------------------------------------------------------------
// Edit mode
// ---------------------------------------------------------------------------

function EditWrapper() {
  const { register } = useForm()
  return <VitalsSection register={register as any} />
}

describe('VitalsSection — edit mode', () => {
  it('renders all six input fields', () => {
    render(<EditWrapper />)
    // Each vital has at least one number input
    const inputs = screen.getAllByRole('spinbutton')
    // height, weight, temp, bpSys, bpDia, pulse, glucose = 7 spinbuttons
    expect(inputs.length).toBe(7)
  })

  it('renders unit selects for height, weight, temp, glucose', () => {
    render(<EditWrapper />)
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBe(4)
  })
})
