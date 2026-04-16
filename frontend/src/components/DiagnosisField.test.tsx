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
  const select = screen.getByRole('combobox', { name: '' })
  // scope by class since both select and ICD input are comboboxes
  const selects = screen.getAllByRole('combobox')
  const conditionSelect = selects.find(el => el.tagName === 'SELECT')
  expect(conditionSelect).toBeInTheDocument()
  expect(screen.getByText('ICD_CONDITION_NEW')).toBeInTheDocument()
  expect(screen.getByText('ICD_CONDITION_SUBSEQUENT')).toBeInTheDocument()
})

it('calls onConditionChange when condition select changes', () => {
  const { onConditionChange } = renderField()
  const selects = screen.getAllByRole('combobox')
  const conditionSelect = selects.find(el => el.tagName === 'SELECT')!
  fireEvent.change(conditionSelect, { target: { value: 'NEWDIAG' } })
  expect(onConditionChange).toHaveBeenCalledWith('NEWDIAG')
})

it('reflects conditionValue in the select', () => {
  renderField({ conditionValue: 'SUBSDIAG' })
  const selects = screen.getAllByRole('combobox')
  const conditionSelect = selects.find(el => el.tagName === 'SELECT')!
  expect(conditionSelect).toHaveValue('SUBSDIAG')
})

it('renders the ICD autocomplete input', () => {
  renderField()
  const selects = screen.getAllByRole('combobox')
  const icdInput = selects.find(el => el.tagName === 'INPUT')
  expect(icdInput).toBeInTheDocument()
  expect(selects.length).toBe(2)
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
    const selects = screen.getAllByRole('combobox')
    selects.forEach(el => expect(el).toBeDisabled())
  })
})
