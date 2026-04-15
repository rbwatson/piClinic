/**
 * NameBlock.tsx
 *
 * Patient name heading block rendered at the top of all visit pages.
 * Matches v1 div.nameBlock.
 *
 * Left block:  patient name as h1, sex, DOB, patient ID link
 * Right block: visit date label + value, optional visit ID
 *              (visitID omitted on visitOpen — not yet assigned)
 *
 * Usage:
 *   <NameBlock
 *     patientName="Alpha Benchmark"
 *     patientSex="M"
 *     patientDOB="2001-07-21"
 *     patientID="PT-GEN-000001"
 *     visitDate="4/12/2026, 12:55 PM"
 *     visitID="0000000099012026041203"
 *   />
 *
 *   // visitOpen (no ID yet):
 *   <NameBlock ... visitDate="4/12/2026, 12:55 PM" />
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './NameBlock.css'

interface NameBlockProps {
  patientName: string
  patientSex:  string
  patientDOB:  string | null
  patientID:   string
  visitDate:   string | null
  visitID?:    string | null
}

export default function NameBlock({
  patientName,
  patientSex,
  patientDOB,
  patientID,
  visitDate,
  visitID,
}: NameBlockProps) {
  const { t } = useTranslation()

  return (
    <div className="name-block">

      {/* Left: patient identity */}
      <div className="name-block-left">
        <h1 className="name-block-heading">
          {patientName}
          <span className="name-block-sex">({patientSex})</span>
        </h1>
        <p className="name-block-meta">
          {patientDOB && <span>{patientDOB}&nbsp;&nbsp;</span>}
          <Link to={`/patients/${patientID}`}>{patientID}</Link>
        </p>
      </div>

      {/* Right: visit date + optional visit ID */}
      {visitDate && (
        <div className="name-block-right">
          <p className="name-block-visit-date">
            <span className="name-block-visit-label">{t('VISIT_DATE_LABEL')}: </span>
            {visitDate}
          </p>
          {visitID && (
            <p className="name-block-visit-id">{visitID}</p>
          )}
        </div>
      )}

    </div>
  )
}
