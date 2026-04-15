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
 *            SectionHeading "Pre-Clinic" + vitals table (conditional)
 *     Right: SectionHeading "Additional notes" (conditional) + notes text
 *            SectionHeading "Discharge" + LabelValues (diagnoses, referral)
 */

import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useVisit } from '@/api/visits'
import PageActions     from '@/components/PageActions'
import NameBlock       from '@/components/NameBlock'
import LabelValue      from '@/components/LabelValue'
import SectionHeading  from '@/components/SectionHeading'
import TwoColumnLayout from '@/components/TwoColumnLayout'

// ---------------------------------------------------------------------------
// Vitals display row — plain text, no form controls
// ---------------------------------------------------------------------------

function vitalsValue(value: number | null, units: string | null): string | null {
  if (value == null) return null
  return units ? `${value}\u00a0${units}` : String(value)
}

function VitalsDisplayTable({
  height, heightUnits,
  weight, weightUnits,
  temp, tempUnits,
  bpSystolic, bpDiastolic,
  pulse,
  glucose, glucoseUnits,
}: {
  height: number | null;      heightUnits: string | null
  weight: number | null;      weightUnits: string | null
  temp: number | null;        tempUnits: string | null
  bpSystolic: number | null;  bpDiastolic: number | null
  pulse: number | null
  glucose: number | null;     glucoseUnits: string | null
}) {
  const { t } = useTranslation()

  const bp = bpSystolic != null
    ? `${bpSystolic}/${bpDiastolic ?? '?'}`
    : null

  const cols = [
    { label: t('VISIT_HEIGHT_LABEL'),  value: vitalsValue(height, heightUnits) },
    { label: t('VISIT_WEIGHT_LABEL'),  value: vitalsValue(weight, weightUnits) },
    { label: t('VISIT_TEMP_LABEL'),    value: vitalsValue(temp, tempUnits) },
    { label: t('VISIT_BP_LABEL'),      value: bp },
    { label: t('VISIT_PULSE_LABEL'),   value: pulse != null ? String(pulse) : null },
    { label: t('VISIT_GLUCOSE_LABEL'), value: vitalsValue(glucose, glucoseUnits) },
  ]

  return (
    <table className="data-table">
      <thead>
        <tr>
          {cols.map((c) => <th key={c.label}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        <tr>
          {cols.map((c) => (
            <td key={c.label} className={c.value == null ? 'dt-inactive' : undefined}>
              {c.value ?? '\u2014'}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VisitDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()

  const patientVisitID = id ?? ''
  const { data: visit, isLoading, isError } = useVisit(patientVisitID)

  if (isLoading) return <p className="loading-state">{t('LOADING')}</p>
  if (isError || !visit) {
    return <div className="error-banner"><p>{t('ERROR_NOT_FOUND')}</p></div>
  }

  const isOpen = visit.visitStatus === 'Open'

  const hasVitals =
    visit.height != null || visit.weight != null || visit.temp != null ||
    visit.bpSystolic != null || visit.pulse != null || visit.glucose != null

  const patientName = `${visit.patientLastName}, ${visit.patientFirstName}`

  const icdSearchLink = (
    <a href="/helpHome.php?topic=icd" target="helpIndex">{t('ICD_SEARCH_LINK')}</a>
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

      {hasVitals && (
        <>
          <SectionHeading title={t('VISIT_PRECLINIC_HEADING')} />
          <VitalsDisplayTable
            height={visit.height}           heightUnits={visit.heightUnits}
            weight={visit.weight}           weightUnits={visit.weightUnits}
            temp={visit.temp}               tempUnits={visit.tempUnits}
            bpSystolic={visit.bpSystolic}   bpDiastolic={visit.bpDiastolic}
            pulse={visit.pulse}
            glucose={visit.glucose}         glucoseUnits={visit.glucoseUnits}
          />
        </>
      )}
    </>
  )

  const rightColumn = (
    <>
      {visit.secondaryComplaint && (
        <>
          <SectionHeading title={t('VISIT_COMPLAINT_ADDITIONAL_LABEL')} />
          <p className="lv-value" style={{ whiteSpace: 'pre-wrap' }}>{visit.secondaryComplaint}</p>
        </>
      )}

      <SectionHeading title={t('VISIT_DIAGNOSES_HEADING')} extra={icdSearchLink} />
      <LabelValue label={t('VISIT_DISCHARGED_LABEL')}
        value={visit.dateTimeOut ? new Date(visit.dateTimeOut).toLocaleString() : null} />

      {[1, 2, 3].map((n) => {
        const condition = visit[`condition${n}` as 'condition1']
        const diagnosis = visit[`diagnosis${n}` as 'diagnosis1']
        return (
          <LabelValue
            key={n}
            label={t(`VISIT_DIAGNOSIS_${n}_LABEL`)}
            value={condition
              ? <><span style={{ fontFamily: 'monospace', fontSize: '87.5%', marginRight: '0.5em' }}>{condition}</span>{diagnosis}</>
              : null
            }
          />
        )
      })}

      <LabelValue label={t('VISIT_REFERRED_TO_LABEL')} value={visit.referredTo} />
    </>
  )

  return (
    <div>
      <PageActions>
        <PageActions.Link to="/patients">{t('PATIENT_FIND_ANOTHER')}</PageActions.Link>
        {isOpen && (
          <>
            <PageActions.Link to={`/visits/${patientVisitID}/close`}>{t('VISIT_CLOSE_ACTION')}</PageActions.Link>
            <PageActions.Link to={`/visits/${patientVisitID}/edit`}>{t('VISIT_EDIT_ACTION')}</PageActions.Link>
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
