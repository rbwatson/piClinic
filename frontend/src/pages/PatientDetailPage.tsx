/**
 * PatientDetailPage.tsx
 *
 * Read-only patient information screen. Matches v1 ptInfo.php.
 *
 * Layout:
 *   - PageActions strip: search bar + "add new patient"
 *   - Patient name as h1 (prominent, like v1 .nameBlock)
 *   - optionMenu row: Edit | Admit (conditional)
 *   - Open visit banner (conditional, gray bg like v1 .currentVisitList)
 *   - Two-column responsive layout at md:
 *       Left:  patient data (personal, medical, address, contact)
 *       Right: visit history table
 */

import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePatient, patientDisplayName } from '@/api/patients'
import { useVisitsByPatient, type Visit } from '@/api/visits'
import PageActions from '@/components/PageActions'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') {
    return (
      <div className="flex gap-2 py-1 border-b border-border last:border-0">
        <span className="w-40 flex-shrink-0 text-xs font-semibold text-foreground">{label}:</span>
        <span className="text-sm text-inactive italic text-muted-foreground">—</span>
      </div>
    )
  }
  return (
    <div className="flex gap-2 py-1 border-b border-border last:border-0">
      <span className="w-40 flex-shrink-0 text-xs font-semibold text-foreground">{label}:</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-base font-medium text-foreground mt-4 mb-2">
      {title}
    </h2>
  )
}

function VisitRow({ visit }: { visit: Visit }) {
  const date = visit.dateTimeIn
    ? new Date(visit.dateTimeIn).toLocaleDateString()
    : '—'
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="py-1.5 pr-3 text-sm">
        <Link to={`/visits/${visit.patientVisitID}`} className="text-primary hover:underline">
          {date}
        </Link>
      </td>
      <td className="py-1.5 pr-3 text-sm text-foreground">{visit.staffName ?? '—'}</td>
      <td className="py-1.5 text-sm text-foreground">
        {visit.diagnosis1 || visit.condition1
          ? <span><span className="font-mono text-xs mr-1">{visit.condition1}</span>{visit.diagnosis1}</span>
          : <span className="text-muted-foreground italic">—</span>}
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PatientDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const clinicPatientID = id ?? ''

  const { data: patient, isLoading: patientLoading, isError: patientError } =
    usePatient(clinicPatientID)

  const { data: visits, isLoading: visitsLoading } =
    useVisitsByPatient(clinicPatientID)

  const openVisit   = visits?.find((v) => v.visitStatus === 'Open')
  const closedVisits = visits?.filter((v) => v.visitStatus === 'Closed') ?? []

  if (patientLoading) {
    return <p className="text-sm text-muted-foreground">{t('LOADING')}</p>
  }

  if (patientError || !patient) {
    return (
      <div className="max-w-xl">
        <div className="rounded bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive mb-4">
          {t('PATIENT_NOT_FOUND')}
        </div>
        <button onClick={() => navigate(-1)} className="text-sm text-primary hover:underline">
          {t('ACTION_BACK')}
        </button>
      </div>
    )
  }

  const allergies    = patient.knownAllergies?.split('|').filter(Boolean) ?? []
  const medications  = patient.currentMedications?.split('|').filter(Boolean) ?? []

  const addressParts = [
    patient.homeAddress1,
    patient.homeAddress2,
    patient.homeNeighborhood,
    patient.homeCity,
    patient.homeCounty,
    patient.homeState,
  ].filter(Boolean)

  return (
    <div>
      {/* PageActions strip */}
      <PageActions>
        <PageActions.Link to="/patients">{t('PATIENT_FIND_ANOTHER')}</PageActions.Link>
        <PageActions.Link to="/patients/new">{t('PATIENT_ADD_NEW')}</PageActions.Link>
      </PageActions>

      {/* Patient name — prominent h1 */}
      <h1 className="text-xl font-medium text-foreground mb-1">
        {patientDisplayName(patient)}
      </h1>

      {/* Option menu row */}
      <div className="flex items-center gap-4 mb-4 text-sm border-b border-border pb-2">
        <Link to={`/patients/${clinicPatientID}/edit`} className="text-primary hover:underline">
          {t('PATIENT_EDIT')}
        </Link>
        {!openVisit && (
          <Link
            to={`/visits/new?patient=${encodeURIComponent(clinicPatientID)}`}
            className="text-primary hover:underline"
          >
            {t('PATIENT_OPEN_VISIT')}
          </Link>
        )}
      </div>

      {/* Current visit — gray banner matching v1 .currentVisitList */}
      {openVisit && (
        <div className="mb-4 bg-muted border border-border rounded px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground mb-2">
            {t('PATIENT_CURRENT_VISIT_HEADING')}
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-1 text-xs font-semibold pr-4">{t('VISIT_ARRIVED_LABEL')}</th>
                <th className="text-left pb-1 text-xs font-semibold pr-4">{t('VISIT_ASSIGNED_LABEL')}</th>
                <th className="text-left pb-1 text-xs font-semibold pr-4">{t('VISIT_COMPLAINT_PRIMARY_LABEL')}</th>
                <th className="pb-1" />
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1 pr-4 text-foreground">
                  {openVisit.dateTimeIn
                    ? new Date(openVisit.dateTimeIn).toLocaleDateString()
                    : '—'}
                </td>
                <td className="py-1 pr-4 text-foreground">{openVisit.staffName ?? '—'}</td>
                <td className="py-1 pr-4 text-foreground">{openVisit.primaryComplaint ?? '—'}</td>
                <td className="py-1 text-right whitespace-nowrap">
                  <Link to={`/visits/${openVisit.patientVisitID}`} className="text-primary hover:underline mr-3 text-xs">
                    {t('VISIT_LIST_ACTION_VIEW')}
                  </Link>
                  <Link to={`/visits/${openVisit.patientVisitID}/edit`} className="text-primary hover:underline mr-3 text-xs">
                    {t('VISIT_LIST_ACTION_EDIT')}
                  </Link>
                  <Link to={`/visits/${openVisit.patientVisitID}/close`} className="text-destructive hover:underline text-xs">
                    {t('VISIT_LIST_ACTION_DISCHARGE')}
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Two-column responsive layout */}
      <div className="flex flex-col md:flex-row md:gap-8 md:items-start">

        {/* Left column: patient data */}
        <div className="flex-1 min-w-0">
          <SectionHeading title={t('PATIENT_DATA_HEAD')} />
          <InfoRow label={t('PATIENT_NAME_LABEL')}          value={patientDisplayName(patient)} />
          <InfoRow label={t('PATIENT_FAMILY_ID_LABEL')}     value={patient.familyID} />
          <InfoRow label={t('PATIENT_ID_LABEL')}            value={patient.clinicPatientID} />
          <InfoRow label={t('PATIENT_NATIONAL_ID_LABEL')}   value={patient.patientNationalID} />
          <InfoRow label={t('PATIENT_BIRTHDATE_LABEL')}     value={patient.birthDate} />
          <InfoRow label={t('NEXT_VAX_DATE_INPUT_LABEL')}   value={patient.nextVaccinationDate} />
          <InfoRow label={t('PATIENT_MARITAL_STATUS_LABEL')} value={patient.maritalStatus} />
          <InfoRow label={t('PATIENT_RESPONSIBLE_PARTY_LABEL')} value={patient.responsibleParty} />
          <InfoRow label={t('PATIENT_PROFESSION_LABEL')}    value={patient.profession} />

          <InfoRow
            label={t('PATIENT_ALLERGIES_HEADING')}
            value={
              allergies.length > 0
                ? <ul className="list-disc list-inside">{allergies.map((a, i) => <li key={i}>{a}</li>)}</ul>
                : <span className="italic text-muted-foreground">{t('PATIENT_NO_ALLERGIES')}</span>
            }
          />
          <InfoRow
            label={t('PATIENT_MEDICATIONS_HEADING')}
            value={
              medications.length > 0
                ? <ul className="list-disc list-inside">{medications.map((m, i) => <li key={i}>{m}</li>)}</ul>
                : <span className="italic text-muted-foreground">{t('PATIENT_NO_MEDICATIONS')}</span>
            }
          />
          <InfoRow label={t('PATIENT_BLOODTYPE_LABEL')}     value={patient.bloodType} />
          <InfoRow label={t('PATIENT_PREFERRED_LANGUAGE_LABEL')} value={patient.preferredLanguage} />

          <SectionHeading title={t('PATIENT_ADDRESS_LABEL')} />
          {addressParts.length > 0
            ? addressParts.map((part, i) => (
                <p key={i} className="text-sm text-foreground">{part}</p>
              ))
            : <p className="text-sm italic text-muted-foreground">—</p>}

          <SectionHeading title={t('PATIENT_CONTACT_LABEL')} />
          <InfoRow label={t('PATIENT_PHONE_LABEL')}     value={patient.contactPhone} />
          <InfoRow label={t('PATIENT_ALT_PHONE_LABEL')} value={patient.contactAltPhone} />
        </div>

        {/* Right column: visit history */}
        <div className="flex-1 min-w-0 mt-6 md:mt-0">
          <SectionHeading title={t('PATIENT_VISIT_HISTORY_HEADING')} />
          {visitsLoading ? (
            <p className="text-sm text-muted-foreground">{t('LOADING')}</p>
          ) : closedVisits.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">{t('PATIENT_NO_PRIOR_VISITS')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-1 text-xs font-semibold pr-3">{t('VISIT_DATE_LABEL')}</th>
                  <th className="text-left pb-1 text-xs font-semibold pr-3">{t('VISIT_ASSIGNED_LABEL')}</th>
                  <th className="text-left pb-1 text-xs font-semibold">{t('VISIT_DIAGNOSIS_1_LABEL')}</th>
                </tr>
              </thead>
              <tbody>
                {closedVisits.map((v) => <VisitRow key={v.patientVisitID} visit={v} />)}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}