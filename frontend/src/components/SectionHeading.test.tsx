/**
 * SectionHeading.test.tsx
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SectionHeading from '@/components/SectionHeading'

describe('SectionHeading', () => {
  it('renders the title as an h2', () => {
    render(<SectionHeading title="Patient data" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Patient data' })).toBeInTheDocument()
  })

  it('renders extra content when provided', () => {
    render(<SectionHeading title="Discharge" extra={<a href="/icd">Search ICD-10</a>} />)
    expect(screen.getByRole('link', { name: 'Search ICD-10' })).toBeInTheDocument()
  })

  it('does not render extra slot when omitted', () => {
    render(<SectionHeading title="Patient data" />)
    expect(screen.queryByText('section-heading-extra')).not.toBeInTheDocument()
  })

  it('applies section-heading class to the h2', () => {
    render(<SectionHeading title="Patient data" />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveClass('section-heading')
  })
})
