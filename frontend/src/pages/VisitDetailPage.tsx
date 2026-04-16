/**
 * VisitDetailPage.tsx
 *
 * Read-only visit display. Matches v1 visitInfo.php.
 * Rebuilt as a composition of confirmed patterns.
 *
 * Layout:
 *   PageActions  — Search for another patient | Discharge | Edit (if open)
 *   NameBlock    — patient name + DOB + ID (left), visit date + visit ID (right)
 *   LabelValue   — status (full width)
 *   TwoColumnLayout
 *     Left:  SectionHeading "Arrival" + LabelValues
 *            SectionHeading "Pre-Clinic" + VitalsDisplaySection
 *     Right: SectionHeading "Additional notes" (conditional)
 *            SectionHeading "Discharge" + IcdDiagnosisRow x3 + LabelValues
 */

import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useVisit } from '@/api/visits'
import { useIcdDescription } from '@/api/icd'
import PageActions     from '@/components/PageActions'
import NameBlock       from '@/components/NameBlock'
import LabelValue      from '@/components/LabelValue'
import SectionHeading  from '@/components/SectionHeading'
import TwoColumnLayout from '@/components/TwoColumnLayout'
import { VitalsDisplaySection } from '@/components/VitalsSection'

// ---------------------------------------------------------------------------
// IcdDiagnosisRow — fetches description for a stored ICD code
// ---------------------------------------------------------------------------

function IcdDiagnosisRow({ label, code, language }: {
  label: string
  code: string | null
  language: 'en' | 'es'
}) {
  const { data: icd } = useIcdDescription(code, language)
  const display = !code
    ? null
    : icd
      ? `${code.padEnd(9)}${icd.shortDescription ?? ''}`.trimEnd()
      : code
  return (
    <LabelValue
      label={label}
      value={display
        ? <span style={{ fontFamily: 'monospace', fontSize: '87.5%' }}>{display}</span>
        : null
      }
    />
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VisitDetailPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'
  const patientVisitID = id ?? ''
  const { data: visit, isLoading, isError } = useVisit(patientVisitID)

  if (isLoading) return <p className="loading-state">{t('LOADING')}</p>
  if (isError || !visit) {
    return <div className="error-banner"><p>{t('ERROR_NOT_FOUND')}</p></div>
  }

  const isOpen = visit.visitStatus === 'Open'
  const patientName = `${visit.patientLastName}, ${visit.patientFirstName}`
  const icdSearchLink = (
    <a href="/helpHome.php?topic=icd" target="helpIndex">{t('ICD_LINK_TEXT')}</a>
  )

  const leftColumn = (
    <>
      <SectionHeading title={t('VISIT_ARRIVAL_HEADING')} />
      <LabelValue label={t('VISIT_ARRIVED_LABEL')}
        value={visit.dateTimeIn ? new Date(visit.dateTimeIn).toLocaleString() : null} />
      <LabelValue label={t('VISIT_TYPE_LABEL')}           value={visit.visitType} />
      <LabelValue label={t('VISIT_REFERRED_FROM_LABEL')}  value={visit.referredFrom} />
      <LabelValue label={t('VISIT_COMPLAINT_PRIMARY_LABEL')} value={visit.primaryComplaint} />
      <LabelValue label={t('VISIT_PAYMENT_LABEL')}        value={visit.payment} />
      <LabelValue label={t('VISIT_ASSIGNED_LABEL')}       value={visit.staffName} />

      <SectionHeading title={t('VISIT_PRECLINIC_HEADING')} />
      <VitalsDisplaySection values={{
        height:      visit.height,
        heightUnits: visit.heightUnits,
        weight:      visit.weight,
        weightUnits: visit.weightUnits,
        temp:        visit.temp,
        tempUnits:   visit.tempUnits,
        bpSystolic:  visit.bpSystolic,
        bpDiastolic: visit.bpDiastolic,
        pulse:       visit.pulse,
        glucose:     visit.glucose,
        glucoseUnits: visit.glucoseUnits,
      }} />
    </>
  )

  const rightColumn = (
    <>
      {visit.secondaryComplaint && (
        <>
          <SectionHeading title={t('VISIT_COMPLAINT_ADDITIONAL_LABEL')} />
          <p className="lv-value" style={{ whiteSpace: 'pre-wrap' }}>
            {visit.secondaryComplaint}
          </p>
        </>
      )}

      <SectionHeading title={t('VISIT_DIAGNOSES_HEADING')} extra={icdSearchLink} />
      <LabelValue label={t('VISIT_DISCHARGED_LABEL')}
        value={visit.dateTimeOut ? new Date(visit.dateTimeOut).toLocaleString() : null} />

      {[1, 2, 3].map((n) => (
        <IcdDiagnosisRow
          key={n}
          label={t(`VISIT_DIAGNOSIS_${n}_LABEL`)}
          code={visit[`diagnosis${n}` as 'diagnosis1'] ?? null}
          language={lang}
        />
      ))}

      <LabelValue label={t('VISIT_REFERRED_TO_LABEL')} value={visit.referredTo} />
    </>
  )

  return (
    <div>
      <PageActions>
        <PageActions.Link to="/patients">{t('PATIENT_FIND_ANOTHER')}</PageActions.Link>
        {isOpen && (
          <>
            <PageActions.Link to={`/visits/${patientVisitID}/close`}>
              {t('VISIT_CLOSE_ACTION')}
            </PageActions.Link>
            <PageActions.Link to={`/visits/${patientVisitID}/edit`}>
              {t('VISIT_EDIT_ACTION')}
            </PageActions.Link>
          </>
        )}
      </PageActions>

      <NameBlock
        patientName={patientName}
        patientSex={visit.patientSex ?? ''}
        patientDOB={visit.patientBirthDate}
        patientID={visit.clinicPatientID}
        visitDate={visit.dateTimeIn ? new Date(visit.dateTimeIn).toLocaleString() : null}
        visitID={visit.patientVisitID}
      />

      <LabelValue
        label={t('VISIT_STATUS_LABEL')}
        value={isOpen ? t('VISIT_STATUS_OPEN') : t('VISIT_STATUS_CLOSED')}
      />

      <TwoColumnLayout left={leftColumn} right={rightColumn} />
    </div>
  )
}
