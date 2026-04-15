/**
 * TwoColumnLayout.tsx
 *
 * Places two content blocks side by side on wide screens,
 * stacking vertically on mobile (below 768px).
 *
 * Matches v1 side-by-side div.infoBlock layout.
 *
 * Usage:
 *   <TwoColumnLayout
 *     left={<PatientDataSection />}
 *     right={<VisitHistorySection />}
 *   />
 */

import './TwoColumnLayout.css'

interface TwoColumnLayoutProps {
  left:  React.ReactNode
  right: React.ReactNode
}

export default function TwoColumnLayout({ left, right }: TwoColumnLayoutProps) {
  return (
    <div className="two-col">
      <div className="two-col-left">{left}</div>
      <div className="two-col-right">{right}</div>
    </div>
  )
}
