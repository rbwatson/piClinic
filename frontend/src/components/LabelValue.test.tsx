/**
 * LabelValue.test.tsx
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LabelValue from '@/components/LabelValue'

describe('LabelValue', () => {
  it('renders the label', () => {
    render(<LabelValue label="Patient name" value="Alpha Benchmark" />)
    expect(screen.getByText('Patient name')).toBeInTheDocument()
  })

  it('renders the value', () => {
    render(<LabelValue label="Patient name" value="Alpha Benchmark" />)
    expect(screen.getByText('Alpha Benchmark')).toBeInTheDocument()
  })

  it('renders the default empty placeholder when value is null', () => {
    render(<LabelValue label="Allergies" value={null} />)
    expect(screen.getByText('\u2014')).toBeInTheDocument()
  })

  it('renders the default empty placeholder when value is undefined', () => {
    render(<LabelValue label="Allergies" value={undefined} />)
    expect(screen.getByText('\u2014')).toBeInTheDocument()
  })

  it('renders the default empty placeholder when value is empty string', () => {
    render(<LabelValue label="Allergies" value="" />)
    expect(screen.getByText('\u2014')).toBeInTheDocument()
  })

  it('renders custom emptyText when provided', () => {
    render(<LabelValue label="Allergies" value={null} emptyText="None recorded" />)
    expect(screen.getByText('None recorded')).toBeInTheDocument()
  })

  it('applies lv-empty class to empty placeholder', () => {
    render(<LabelValue label="Allergies" value={null} />)
    expect(screen.getByText('\u2014')).toHaveClass('lv-empty')
  })

  it('applies lv-value class to non-empty value', () => {
    render(<LabelValue label="Patient name" value="Alpha Benchmark" />)
    expect(screen.getByText('Alpha Benchmark')).toHaveClass('lv-value')
  })

  it('renders a ReactNode value (list)', () => {
    render(
      <LabelValue
        label="Medications"
        value={<ul><li>Aspirin</li><li>Metformin</li></ul>}
      />
    )
    expect(screen.getByText('Aspirin')).toBeInTheDocument()
    expect(screen.getByText('Metformin')).toBeInTheDocument()
  })

  it('does not render lv-empty when value is the number 0', () => {
    render(<LabelValue label="Payment" value={0} />)
    expect(screen.queryByText('\u2014')).not.toBeInTheDocument()
  })
})
