/**
 * LabelValue.tsx
 *
 * Renders a single label-value pair.
 *
 * Matches v1 div.dataBlock > p > label + span pattern.
 * Used for read-only display fields and locked fields inside forms.
 * Value accepts ReactNode so callers can pass lists (allergies, medications).
 *
 * Empty value handling:
 *   null, undefined, or '' renders emptyText (default "\u2014") in italic gray.
 *
 * Usage:
 *   <LabelValue label="Patient name" value="Alpha Benchmark" />
 *   <LabelValue label="Allergies" value={null} />
 *   <LabelValue label="Allergies" value={null} emptyText="None recorded" />
 *   <LabelValue label="Medications" value={<ul>{...}</ul>} />
 */

import './LabelValue.css'

interface LabelValueProps {
  label: string
  value: React.ReactNode
  emptyText?: string
}

export default function LabelValue({ label, value, emptyText = '\u2014' }: LabelValueProps) {
  const isEmpty = value === null || value === undefined || value === ''

  return (
    <div className="label-value">
      <span className="lv-label">{label}</span>
      {isEmpty
        ? <span className="lv-empty">{emptyText}</span>
        : <span className="lv-value">{value}</span>
      }
    </div>
  )
}
