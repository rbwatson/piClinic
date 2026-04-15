/**
 * SectionHeading.tsx
 *
 * Section label rendered as h2 above a group of related fields.
 * Matches v1 h2 inside .pageBody.
 *
 * Optional `extra` prop renders inline smaller content at the same
 * baseline — used for links like "Search ICD-10 code".
 *
 * Usage:
 *   <SectionHeading title="Patient data" />
 *   <SectionHeading title="Discharge" extra={<a href="...">Search ICD-10</a>} />
 */

import './SectionHeading.css'

interface SectionHeadingProps {
  title: string
  extra?: React.ReactNode
}

export default function SectionHeading({ title, extra }: SectionHeadingProps) {
  return (
    <h2 className="section-heading">
      {title}
      {extra && <span className="section-heading-extra">{extra}</span>}
    </h2>
  )
}
