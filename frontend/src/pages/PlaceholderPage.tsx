/**
 * PlaceholderPage.tsx
 * Temporary stand-in for pages not yet built (Groups 2-7).
 * Receives a title prop so the router can label each route distinctly.
 */

interface Props {
  title: string
}

export default function PlaceholderPage({ title }: Props) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground text-sm">{title} — coming soon</p>
    </div>
  )
}
