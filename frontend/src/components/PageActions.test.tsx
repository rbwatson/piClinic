/**
 * PageActions.test.tsx
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PageActions from '@/components/PageActions'

function renderActions(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('PageActions', () => {
  it('renders a Link item', () => {
    renderActions(
      <PageActions>
        <PageActions.Link to="/patients">Find patient</PageActions.Link>
      </PageActions>
    )
    expect(screen.getByRole('link', { name: 'Find patient' })).toBeInTheDocument()
  })

  it('renders a Button item', async () => {
    const handler = vi.fn()
    renderActions(
      <PageActions>
        <PageActions.Button onClick={handler}>Print</PageActions.Button>
      </PageActions>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Print' }))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('applies pa-destructive class for destructive variant', () => {
    const handler = vi.fn()
    renderActions(
      <PageActions>
        <PageActions.Button variant="destructive" onClick={handler}>Delete</PageActions.Button>
      </PageActions>
    )
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('pa-destructive')
  })

  it('does not apply pa-destructive class for default variant', () => {
    renderActions(
      <PageActions>
        <PageActions.Button onClick={vi.fn()}>Save</PageActions.Button>
      </PageActions>
    )
    expect(screen.getByRole('button', { name: 'Save' })).not.toHaveClass('pa-destructive')
  })

  it('renders multiple items without crashing', () => {
    renderActions(
      <PageActions>
        <PageActions.Link to="/patients">Back</PageActions.Link>
        <PageActions.Button onClick={vi.fn()}>Print</PageActions.Button>
        <PageActions.Button variant="destructive" onClick={vi.fn()}>Delete</PageActions.Button>
      </PageActions>
    )
    expect(screen.getByRole('link', { name: 'Back' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Print' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })
})