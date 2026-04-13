/**
 * ICD10Autocomplete.test.tsx
 *
 * Component tests for the ICD-10 autocomplete widget.
 * The API call is mocked — no real network or database needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ICD10Autocomplete from '@/components/ICD10Autocomplete'
import * as icdApi from '@/api/icd'

const MOCK_RESULTS = [
  { language: 'en', icd10code: 'J06.9', icd10index: 'J069',
    shortDescription: 'Acute upper respiratory infection', useCount: 10, lastUsedDate: null },
  { language: 'en', icd10code: 'A09',   icd10index: 'A09',
    shortDescription: 'Infectious gastroenteritis',        useCount:  5, lastUsedDate: null },
]

describe('ICD10Autocomplete', () => {
  const onSelect = vi.fn()

  beforeEach(() => {
    vi.restoreAllMocks()
    onSelect.mockReset()
  })

  it('renders the input field', () => {
    render(<ICD10Autocomplete value="" onSelect={onSelect} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('does not search when input is less than 2 characters', async () => {
    const searchSpy = vi.spyOn(icdApi, 'searchIcdCodes')
    render(<ICD10Autocomplete value="" onSelect={onSelect} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'J' } })
    await waitFor(() => {
      expect(searchSpy).not.toHaveBeenCalled()
    })
  })

  it('shows results after typing a query', async () => {
    vi.spyOn(icdApi, 'searchIcdCodes').mockResolvedValue(MOCK_RESULTS)
    render(<ICD10Autocomplete value="" onSelect={onSelect} />)

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'res' } })
      // Advance past the 350ms debounce
      await new Promise((r) => setTimeout(r, 400))
    })

    await waitFor(() => {
      expect(screen.getByText('J06.9')).toBeInTheDocument()
      expect(screen.getByText('Acute upper respiratory infection')).toBeInTheDocument()
    })
  })

  it('calls onSelect with code and description when a result is clicked', async () => {
    vi.spyOn(icdApi, 'searchIcdCodes').mockResolvedValue(MOCK_RESULTS)
    render(<ICD10Autocomplete value="" onSelect={onSelect} />)

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'res' } })
      await new Promise((r) => setTimeout(r, 400))
    })

    await waitFor(() => screen.getByText('J06.9'))
    fireEvent.mouseDown(screen.getByText('J06.9').closest('li')!)

    expect(onSelect).toHaveBeenCalledWith('J06.9', 'Acute upper respiratory infection')
  })

  it('closes the dropdown on Escape', async () => {
    vi.spyOn(icdApi, 'searchIcdCodes').mockResolvedValue(MOCK_RESULTS)
    render(<ICD10Autocomplete value="" onSelect={onSelect} />)

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'res' } })
      await new Promise((r) => setTimeout(r, 400))
    })

    await waitFor(() => screen.getByRole('listbox'))
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('navigates results with arrow keys and selects with Enter', async () => {
    vi.spyOn(icdApi, 'searchIcdCodes').mockResolvedValue(MOCK_RESULTS)
    render(<ICD10Autocomplete value="" onSelect={onSelect} />)

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'inf' } })
      await new Promise((r) => setTimeout(r, 400))
    })

    await waitFor(() => screen.getByRole('listbox'))
    const input = screen.getByRole('combobox')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledWith('J06.9', 'Acute upper respiratory infection')
  })

  it('shows no dropdown when query returns empty results', async () => {
    vi.spyOn(icdApi, 'searchIcdCodes').mockResolvedValue([])
    render(<ICD10Autocomplete value="" onSelect={onSelect} />)

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'xyz' } })
      await new Promise((r) => setTimeout(r, 400))
    })

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
  })
})
