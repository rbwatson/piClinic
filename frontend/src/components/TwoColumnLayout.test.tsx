/**
 * TwoColumnLayout.test.tsx
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TwoColumnLayout from '@/components/TwoColumnLayout'

describe('TwoColumnLayout', () => {
  it('renders left content', () => {
    render(<TwoColumnLayout left={<p>Left content</p>} right={<p>Right content</p>} />)
    expect(screen.getByText('Left content')).toBeInTheDocument()
  })

  it('renders right content', () => {
    render(<TwoColumnLayout left={<p>Left content</p>} right={<p>Right content</p>} />)
    expect(screen.getByText('Right content')).toBeInTheDocument()
  })

  it('wraps left in two-col-left div', () => {
    render(<TwoColumnLayout left={<p>Left content</p>} right={<p>Right content</p>} />)
    const left = screen.getByText('Left content').closest('.two-col-left')
    expect(left).toBeInTheDocument()
  })

  it('wraps right in two-col-right div', () => {
    render(<TwoColumnLayout left={<p>Left content</p>} right={<p>Right content</p>} />)
    const right = screen.getByText('Right content').closest('.two-col-right')
    expect(right).toBeInTheDocument()
  })

  it('wraps both in two-col container', () => {
    const { container } = render(
      <TwoColumnLayout left={<p>Left</p>} right={<p>Right</p>} />
    )
    expect(container.querySelector('.two-col')).toBeInTheDocument()
  })
})
