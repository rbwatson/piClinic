/**
 * VisitDetailPage.tsx
 *
 * Read-only visit display. Matches v1 visitInfo.php.
 *
 * Layout:
 *   - PageActions strip: patient search + actions
 *   - nameBlock: patient name (h1) + DOB + patient ID link | visit date + visit ID
 *   - optionMenu: Discharge | Print | Edit (conditional on Open status)
 *   - Status badge (gray bg box like v1 .currentVisitList)
 *   - Two-column responsive layout at md:
 *       Left:  Arrival info + Pre-Clinic vitals
 *       Right: Additional notes + Discharge/Diagnosis section
 */

import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useVisit } from '@/api/visits'
import PageActions from '@/components/PageActions'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-0.5">
      <span className="w-40 flex-shrink-0 text-xs font-semibold text-foreground">{label}:</span>
      <span className="text-sm text-foreground">
        {value ?? <span className="italic text-muted-foreground">—</span>}
      </span>
    </div>
  )
}

function SectionHeading({ title, extra }: { title: string; extra?: React.ReactNode }) {
  return (
    <h2 className="text-base font-medium text-foreground mt-4 mb-2 flex items-baseline gap-3">
      {title}
      {extra && <span className="text-xs font-normal">{extra}</span>}
    </h2>
  )
}

export default function VisitDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()

  const patientVisitID = id ?? ''
  const { data: visit, isLoading, isError } = useVisit(patientVisitID)

  if (isLoading) return <p className="text-sm text-muted-foreground">{t('LOADING')}</p>
  if (isError || !visit) {
    return (
      <div className="rounded bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
        {t('ERROR_NOT_FOUND')}
      </div>
    )
  }

  const isOpen = visit.visitStatus === 'Open'

  const hasVitals =
    visit.height != null || visit.weight != null || visit.temp != null ||
    visit.bpSystolic != null || visit.pulse != null || visit.glucose != null

  const hasDiagnoses = visit.diagnosis1 || visit.diagnosis2 || visit.diagnosis3

  return (
    <div>
      {/* PageActions */}
      <PageActions>
        <PageActions.Link to="/patients">{t('PATIENT_FIND_ANOTHER')}</PageActions.Link>
        {isOpen && (
          <>
            <PageActions.Link to={`/visits/${patientVisitID}/close`}>{t('VISIT_CLOSE_ACTION')}</PageActions.Link>
            <PageActions.Link to={`/visits/${patientVisitID}/edit`}>{t('VISIT_EDIT_ACTION')}</PageActions.Link>
          </>
        )}
      </PageActions>

      {/* nameBlock — patient name + DOB + ID on left, visit date + ID on right */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-8 mb-3">
        <div className="flex-1">
          <h1 className="text-xl font-medium text-foreground leading-tight">
            {visit.patientFirstName} {visit.patientLastName}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({visit.patientSex})
            </span>
          </h1>
          {visit.patientBirthDate && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {visit.patientBirthDate}&nbsp;&nbsp;
              <Link to={`/patients/${visit.clinicPatientID}`} className="text-primary hover:underline">
                {visit.clinicPatientID}
              </Link>
            </p>
          )}
        </div>
        <div className="mt-1 sm:mt-0 sm:text-right flex-shrink-0">
          {visit.dateTimeIn && (
            <p className="text-sm text-foreground">
              <span className="font-semibold text-xs">{t('VISIT_DATE_LABEL')}:</span>{' '}
              {new Date(visit.dateTimeIn).toLocaleString()}
            </p>
          )}
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{visit.patientVisitID}</p>
        </div>
      </div>

      {/* Status badge — gray box like v1 .currentVisitList */}
      <div className="bg-muted border border-border rounded px-4 py-2 mb-4 flex items-center gap-3">
        <span className="text-xs font-semibold text-foreground">{t('VISIT_STATUS_LABEL')}:</span>
        <span className={`text-sm font-medium ${isOpen ? 'text-primary' : 'text-muted-foreground'}`}>
          {isOpen ? t('VISIT_STATUS_OPEN') : t('VISIT_STATUS_CLOSED')}
        </span>
        {visit.dateTimeOut && !isOpen && (
          <span className="text-xs text-muted-foreground ml-2">
            {t('VISIT_DISCHARGED_LABEL')}: {new Date(visit.dateTimeOut).toLocaleString()}
          </span>
        )}
      </div>

      {/* Two-column content */}
      <div className="flex flex-col md:flex-row md:gap-8 md:items-start">

        {/* Left: Arrival + Pre-Clinic */}
        <div className="flex-1 min-w-0">
          <SectionHeading title={t('VISIT_ARRIVED_LABEL')} />
          <InfoRow label={t('VISIT_ARRIVED_LABEL')}
            value={visit.dateTimeIn ? new Date(visit.dateTimeIn).toLocaleString() : null} />
          <InfoRow label={t('VISIT_TYPE_LABEL')}          value={visit.visitType} />
          <InfoRow label={t('VISIT_REFERRED_FROM_LABEL')} value={visit.referredFrom} />
          <InfoRow label={t('VISIT_COMPLAINT_PRIMARY_LABEL')} value={visit.primaryComplaint} />
          <InfoRow label={t('VISIT_PAYMENT_LABEL')}       value={visit.payment} />
          <InfoRow label={t('VISIT_ASSIGNED_LABEL')}      value={visit.staffName} />

          {hasVitals && (
            <>
              <SectionHeading title={t('VISIT_PRECLINIC_HEADING')} />
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      t('VISIT_HEIGHT_LABEL'), t('VISIT_WEIGHT_LABEL'),
                      t('VISIT_TEMP_LABEL'), t('VISIT_BP_LABEL'),
                      t('VISIT_PULSE_LABEL'), t('VISIT_GLUCOSE_LABEL'),
                    ].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold pb-1 pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 pr-3 text-sm">
                      {visit.height != null ? `${visit.height} ${visit.heightUnits ?? ''}` : '—'}
                    </td>
                    <td className="py-1 pr-3 text-sm">
                      {visit.weight != null ? `${visit.weight} ${visit.weightUnits ?? ''}` : '—'}
                    </td>
                    <td className="py-1 pr-3 text-sm">
                      {visit.temp != null ? `${visit.temp}° ${visit.tempUnits ?? ''}` : '—'}
                    </td>
                    <td className="py-1 pr-3 text-sm">
                      {visit.bpSystolic != null ? `${visit.bpSystolic}/${visit.bpDiastolic ?? '?'}` : '—'}
                    </td>
                    <td className="py-1 pr-3 text-sm">{visit.pulse ?? '—'}</td>
                    <td className="py-1 text-sm">
                      {visit.glucose != null ? `${visit.glucose} ${visit.glucoseUnits ?? ''}` : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Right: Notes + Discharge/Diagnosis */}
        <div className="flex-1 min-w-0 mt-6 md:mt-0">
          {visit.secondaryComplaint && (
            <>
              <SectionHeading title={t('VISIT_COMPLAINT_ADDITIONAL_LABEL')} />
              <p className="text-sm text-foreground whitespace-pre-wrap">{visit.secondaryComplaint}</p>
            </>
          )}

          <SectionHeading title={t('VISIT_DIAGNOSES_HEADING')} />
          <InfoRow label={t('VISIT_DISCHARGED_LABEL')}
            value={visit.dateTimeOut ? new Date(visit.dateTimeOut).toLocaleString() : null} />

          {[1, 2, 3].map((n) => {
            const condition = visit[`condition${n}` as 'condition1']
            const diagnosis = visit[`diagnosis${n}` as 'diagnosis1']
            return (
              <InfoRow
                key={n}
                label={t(`VISIT_DIAGNOSIS_${n}_LABEL`)}
                value={condition
                  ? <span><span className="font-mono text-xs mr-1">{condition}</span>{diagnosis}</span>
                  : null}
              />
            )
          })}

          <InfoRow label={t('VISIT_REFERRED_TO_LABEL')} value={visit.referredTo} />
          {visit.payment && (
            <InfoRow label={t('VISIT_PAYMENT_LABEL')} value={visit.payment} />
          )}
        </div>

      </div>
    </div>
  )
}