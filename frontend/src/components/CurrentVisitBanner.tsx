/**
 * CurrentVisitBanner.tsx
 *
 * Gray banner displayed on the patient detail page when the patient
 * currently has an open visit. Conditionally rendered — absent when
 * there is no open visit.
 *
 * Matches v1 div.currentVisitList.
 *
 * Contains a heading and a DataTable with columns:
 *   Arrived | Doctor | Reason | Actions (View | Edit | Discharge)
 *
 * Usage:
 *   {openVisit && <CurrentVisitBanner visit={openVisit} />}
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DataTable from './DataTable'
import './CurrentVisitBanner.css'
import type { Visit } from '@/api/visits'

interface CurrentVisitBannerProps {
  visit: Visit
}

export default function CurrentVisitBanner({ visit }: CurrentVisitBannerProps) {
  const { t } = useTranslation()

  const actions = (
    <span>
      <Link to={`/visits/${visit.patientVisitID}`}>{t('ACTION_VIEW')}</Link>
      {' | '}
      <Link to={`/visits/${visit.patientVisitID}/edit`}>{t('ACTION_EDIT')}</Link>
      {' | '}
      <Link to={`/visits/${visit.patientVisitID}/close`}>{t('ACTION_DISCHARGE')}</Link>
    </span>
  )

  const columns = [
    { key: 'arrived', heading: t('VISIT_ARRIVED_LABEL') },
    { key: 'doctor',  heading: t('VISIT_DOCTOR_LABEL'), nowrap: true },
    { key: 'reason',  heading: t('VISIT_REASON_LABEL') },
    { key: 'actions', heading: t('VISIT_ACTIONS_LABEL') },
  ]

  const rows = [{
    arrived: visit.dateTimeIn
      ? new Date(visit.dateTimeIn).toLocaleDateString()
      : null,
    doctor:  visit.staffName ?? null,
    reason:  visit.primaryComplaint ?? null,
    actions,
  }]

  return (
    <div className="current-visit-banner">
      <h2>{t('VISIT_CURRENT_HEADING')}</h2>
      <DataTable columns={columns} rows={rows} />
    </div>
  )
}
