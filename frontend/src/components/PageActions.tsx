/**
 * PageActions.tsx
 *
 * Standardised strip of page-level action links and secondary navigation,
 * rendered below the sidebar on every content page. Matches the v1
 * #topicMenuDiv / #optionMenuDiv pattern.
 *
 * Usage:
 *   <PageActions>
 *     <PageActions.Link to="/patients">Search for another patient</PageActions.Link>
 *     <PageActions.Button onClick={handlePrint}>Print</PageActions.Button>
 *   </PageActions>
 *
 * Items are separated by a vertical pipe, matching v1 styling.
 * The strip is hidden on print (noprint).
 */

import { Link } from 'react-router-dom'

interface PageActionsProps {
  children: React.ReactNode
}

interface PageActionsLinkProps {
  to: string
  children: React.ReactNode
  className?: string
}

interface PageActionsButtonProps {
  onClick: () => void
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'destructive'
}

function PageActionsRoot({ children }: PageActionsProps) {
  return (
    <div className="flex items-center gap-0 border-b border-border bg-background py-1.5 px-1 mb-4 flex-wrap print:hidden">
      {children}
    </div>
  )
}

function PageActionsLink({ to, children, className }: PageActionsLinkProps) {
  return (
    <span className="flex items-center">
      <Link
        to={to}
        className={`px-2 text-sm text-primary hover:underline ${className ?? ''}`}
      >
        {children}
      </Link>
      <span className="text-border select-none text-xs last:hidden">|</span>
    </span>
  )
}

function PageActionsButton({
  onClick,
  children,
  className,
  variant = 'default',
}: PageActionsButtonProps) {
  return (
    <span className="flex items-center">
      <button
        type="button"
        onClick={onClick}
        className={`px-2 text-sm hover:underline ${
          variant === 'destructive'
            ? 'text-destructive'
            : 'text-primary'
        } ${className ?? ''}`}
      >
        {children}
      </button>
      <span className="text-border select-none text-xs last:hidden">|</span>
    </span>
  )
}

const PageActions = Object.assign(PageActionsRoot, {
  Link: PageActionsLink,
  Button: PageActionsButton,
})

export default PageActions