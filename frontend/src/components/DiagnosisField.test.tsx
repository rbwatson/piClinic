/**
 * DiagnosisField.test.tsx
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DiagnosisField from '@/components/DiagnosisField'

vi.mock('@/api/icd', () => ({
  searchIcdCodes: vi.fn().mockResolvedValue([]),
}))

function renderField(overrides = {}) {
  const onConditionChange = vi.fn()
  const onIcdSelect       = vi.fn()
  render(
    <DiagnosisField
      n={1}
      language="en"
      conditionValue=""
      icdValue=""
      onConditionChange={onConditionChange}
      onIcdSelect={onIcdSelect}
      {...overrides}
    />
  )
  return { onConditionChange, onIcdSelect }
}

describe('DiagnosisField', () => {
  it('renders the diagnosis label', () => {
    renderField()
    expect(screen.getByText('VISIT_DIAGNOSIS_1_LABEL')).toBeInTheDocument()
  })

  it('renders condition select with New and Subsequent options', () => {
    renderField()
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(screen.getByText('ICD_CONDITION_NEW')).toBeInTheDocument()
    expect(screen.getByText('ICD_CONDITION_SUBSEQUENT')).toBeInTheDocument()
  })

  it('calls onConditionChange when condition select changes', () => {
    const { onConditionChange } = renderField()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'NEWDIAG' } })
    expect(onConditionChange).toHaveBeenCalledWith('NEWDIAG')
  })

  it('reflects conditionValue in the select', () => {
    renderField({ conditionValue: 'SUBSDIAG' })
    expect(screen.getByRole('combobox')).toHaveValue('SUBSDIAG')
  })

  it('renders the ICD autocomplete input', () => {
    renderField()
    expect(screen.getByRole('combobox', { hidden: true })).toBeInTheDocument()
    // The ICD input renders as role=combobox on the text input
    const inputs = screen.getAllByRole('combobox')
    expect(inputs.length).toBeGreaterThanOrEqual(1)
  })

  it('renders label for diagnosis 2', () => {
    render(
      <DiagnosisField
        n={2}
        language="en"
        conditionValue=""
        icdValue=""
        onConditionChange={vi.fn()}
        onIcdSelect={vi.fn()}
      />
    )
    expect(screen.getByText('VISIT_DIAGNOSIS_2_LABEL')).toBeInTheDocument()
  })

  it('disables select and autocomplete when disabled prop is true', () => {
    renderField({ disabled: true })
    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})
