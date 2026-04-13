/**
 * VisitDetailPage.tsx
 *
 * Read-only display of a single visit record. Matches v1 visitInfo.php.
 * Route: /visits/:id
 *
 * Reached from:
 *   - Dashboard action links (View)
 *   - PatientDetailPage visit history table
 *   - VisitEditPage on successful save
 *
 * Actions (Open visits only): Edit, Discharge
 * Always available: Back to patient
 */

import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useVisit } from '@/api/visits'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex gap-2 py-1.5 border-b border-border last:border-0">
      <span className="w-40 flex-shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 mb-4">
      <h2 className="text-sm font-semibold text-foreground mb-3">{title}</h2>
      {children}
    </div>
  )
}

function VitalValue({
  value,
  units,
}: {
  value: number | null
  units: string | null
}) {
  if (value == null) return null
  return <>{value}{units ? ` ${units}` : ''}</>
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VisitDetailPage() {
  const { t }  = useTranslation()
  const { id } = useParams<{ id: string }>()

  const patientVisitID = id ?? ''
  const { data: visit, isLoading, isError } = useVisit(patientVisitID)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('LOADING')}</p>
  }

  if (isError || !visit) {
    return (
      <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
        {t('ERROR_NOT_FOUND')}
      </div>
    )
  }

  const isOpen = visit.visitStatus === 'Open'

  const hasVitals =
    visit.height      != null || visit.weight    != null ||
    visit.temp        != null || visit.bpSystolic != null ||
    visit.pulse       != null || visit.glucose   != null

  const hasDiagnoses =
    visit.diagnosis1 || visit.diagnosis2 || visit.diagnosis3

  const hasReferral = visit.referredFrom || visit.referredTo

  return (
    <div className="max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <Link
            to={`/patients/${visit.clinicPatientID}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {visit.patientFirstName} {visit.patientLastName}
          </Link>
          <span className="text-border">/</span>
          <span className="text-foreground font-medium">
            {visit.dateTimeIn
              ? new Date(visit.dateTimeIn).toLocaleDateString()
              : t('VISIT_DATE_LABEL')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isOpen
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          }`}>
            {isOpen ? t('VISIT_STATUS_OPEN') : t('VISIT_STATUS_CLOSED')}
          </span>

          {isOpen && (
            <>
              <Link
                to={`/visits/${patientVisitID}/edit`}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('VISIT_EDIT_ACTION')}
              </Link>
              <Link
                to={`/visits/${patientVisitID}/close`}
                className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                {t('VISIT_CLOSE_ACTION')}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Visit info */}
      <Section title={t('VISIT_DETAIL_TITLE')}>
        <InfoRow
          label={t('PATIENT_NAME_LABEL')}
          value={`${visit.patientFirstName} ${visit.patientLastName}`}
        />
        <InfoRow label={t('PATIENT_ID_LABEL')}      value={visit.clinicPatientID} />
        <InfoRow label={t('VISIT_TYPE_LABEL')}      value={visit.visitType} />
        <InfoRow label={t('VISIT_ASSIGNED_LABEL')}  value={visit.staffName} />
        <InfoRow
          label={t('VISIT_ARRIVED_LABEL')}
          value={visit.dateTimeIn
            ? new Date(visit.dateTimeIn).toLocaleString()
            : null}
        />
        {!isOpen && (
          <InfoRow
            label={t('VISIT_DISCHARGED_LABEL')}
            value={visit.dateTimeOut
              ? new Date(visit.dateTimeOut).toLocaleString()
              : null}
          />
        )}
        {visit.payment && (
          <InfoRow label={t('VISIT_PAYMENT_LABEL')} value={visit.payment} />
        )}
      </Section>

      {/* Complaints */}
      {(visit.primaryComplaint || visit.secondaryComplaint) && (
        <Section title={t('VISIT_COMPLAINT_PRIMARY_LABEL')}>
          <InfoRow
            label={t('VISIT_COMPLAINT_PRIMARY_LABEL')}
            value={visit.primaryComplaint}
          />
          <InfoRow
            label={t('VISIT_COMPLAINT_ADDITIONAL_LABEL')}
            value={visit.secondaryComplaint}
          />
        </Section>
      )}

      {/* Vitals */}
      {hasVitals && (
        <Section title={t('VISIT_PRECLINIC_HEADING')}>
          <InfoRow
            label={t('VISIT_HEIGHT_LABEL')}
            value={<VitalValue value={visit.height} units={visit.heightUnits} />}
          />
          <InfoRow
            label={t('VISIT_WEIGHT_LABEL')}
            value={<VitalValue value={visit.weight} units={visit.weightUnits} />}
          />
          <InfoRow
            label={t('VISIT_TEMP_LABEL')}
            value={<VitalValue value={visit.temp} units={visit.tempUnits} />}
          />
          {(visit.bpSystolic != null || visit.bpDiastolic != null) && (
            <InfoRow
              label={t('VISIT_BP_LABEL')}
              value={`${visit.bpSystolic ?? '?'} / ${visit.bpDiastolic ?? '?'}`}
            />
          )}
          <InfoRow
            label={t('VISIT_PULSE_LABEL')}
            value={<VitalValue value={visit.pulse} units={null} />}
          />
          <InfoRow
            label={t('VISIT_GLUCOSE_LABEL')}
            value={<VitalValue value={visit.glucose} units={visit.glucoseUnits} />}
          />
        </Section>
      )}

      {/* Diagnoses */}
      {hasDiagnoses && (
        <Section title={t('VISIT_DIAGNOSES_HEADING')}>
          {visit.condition1 && (
            <InfoRow
              label={t('VISIT_DIAGNOSIS_1_LABEL')}
              value={
                <span>
                  <span className="font-mono text-xs mr-2">{visit.condition1}</span>
                  {visit.diagnosis1}
                </span>
              }
            />
          )}
          {visit.condition2 && (
            <InfoRow
              label={t('VISIT_DIAGNOSIS_2_LABEL')}
              value={
                <span>
                  <span className="font-mono text-xs mr-2">{visit.condition2}</span>
                  {visit.diagnosis2}
                </span>
              }
            />
          )}
          {visit.condition3 && (
            <InfoRow
              label={t('VISIT_DIAGNOSIS_3_LABEL')}
              value={
                <span>
                  <span className="font-mono text-xs mr-2">{visit.condition3}</span>
                  {visit.diagnosis3}
                </span>
              }
            />
          )}
        </Section>
      )}

      {/* Referral */}
      {hasReferral && (
        <Section title={t('VISIT_REFERRAL_HEADING')}>
          <InfoRow label={t('VISIT_REFERRED_FROM_LABEL')} value={visit.referredFrom} />
          <InfoRow label={t('VISIT_REFERRED_TO_LABEL')}   value={visit.referredTo} />
        </Section>
      )}

    </div>
  )
}
