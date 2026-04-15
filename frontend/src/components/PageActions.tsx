/**
 * PageActions.tsx
 *
 * Pipe-separated strip of page-level action links rendered below the shell
 * nav bar and above page content. Matches v1 #topicMenuDiv / #optionMenuDiv.
 *
 * Usage:
 *   <PageActions>
 *     <PageActions.Link to="/patients">Search patients</PageActions.Link>
 *     <PageActions.Button onClick={handlePrint}>Print</PageActions.Button>
 *     <PageActions.Button variant="destructive" onClick={handleDelete}>Delete</PageActions.Button>
 *   </PageActions>
 *
 * Plain CSS only. No Tailwind layout classes.
 */

import { Link } from 'react-router-dom'
import './PageActions.css'

function PageActionsRoot({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-actions">
      {children}
    </div>
  )
}

function PageActionsLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <span className="pa-item">
      <Link to={to}>{children}</Link>
    </span>
  )
}

function PageActionsButton({
  onClick,
  children,
  variant = 'default',
}: {
  onClick: () => void
  children: React.ReactNode
  variant?: 'default' | 'destructive'
}) {
  return (
    <span className="pa-item">
      <button
        type="button"
        onClick={onClick}
        className={variant === 'destructive' ? 'pa-destructive' : undefined}
      >
        {children}
      </button>
    </span>
  )
}

const PageActions = Object.assign(PageActionsRoot, {
  Link: PageActionsLink,
  Button: PageActionsButton,
})

export default PageActions