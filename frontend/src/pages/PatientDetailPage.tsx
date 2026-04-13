/**
 * PatientDetailPage.tsx
 *
 * Read-only patient information screen. Matches v1 ptInfo.php.
 *
 * Displays:
 *   - Personal info (name, DOB, sex, IDs, contact, address)
 *   - Medical info (blood type, allergies, medications)
 *   - Current open visit (if any)
 *   - Visit history list
 *
 * Actions:
 *   - Admit this patient (open a new visit) -> /visits/new?patient=:id
 *   - Edit patient info -> /patients/:id/edit
 *   - Back to search
 */

import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePatient, patientDisplayName } from '@/api/patients'
import { useVisitsByPatient, type Visit } from '@/api/visits'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-border last:border-0">
      <span className="w-40 flex-shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">
        {value || <span className="text-muted-foreground italic">—</span>}
      </span>
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

function VisitRow({ visit }: { visit: Visit }) {
  const { t } = useTranslation()
  const date = visit.dateTimeIn
    ? new Date(visit.dateTimeIn).toLocaleDateString()
    : '—'
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="py-2 pr-4 text-sm text-muted-foreground">{date}</td>
      <td className="py-2 pr-4 text-sm text-foreground">
        {visit.primaryComplaint ?? '—'}
      </td>
      <td className="py-2 pr-4 text-sm text-muted-foreground">
        {visit.staffName ?? '—'}
      </td>
      <td className="py-2 pr-4">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            visit.visitStatus === 'Open'
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {visit.visitStatus === 'Open'
            ? t('VISIT_STATUS_OPEN')
            : t('VISIT_STATUS_CLOSED')}
        </span>
      </td>
      <td className="py-2 text-right">
        <Link
          to={`/visits/${visit.patientVisitID}`}
          className="text-xs text-primary hover:underline mr-3"
        >
          {t('VISIT_LIST_ACTION_VIEW')}
        </Link>
        {visit.visitStatus === 'Open' && (
          <Link
            to={`/visits/${visit.patientVisitID}/close`}
            className="text-xs text-destructive hover:underline"
          >
            {t('VISIT_LIST_ACTION_DISCHARGE')}
          </Link>
        )}
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

  const {
    data: patient,
    isLoading: patientLoading,
    isError: patientError,
  } = usePatient(clinicPatientID)

  const { data: visits, isLoading: visitsLoading } =
    useVisitsByPatient(clinicPatientID)

  const openVisit = visits?.find((v) => v.visitStatus === 'Open')
  const closedVisits = visits?.filter((v) => v.visitStatus === 'Closed') ?? []

  if (patientLoading) {
    return <p className="text-sm text-muted-foreground">{t('LOADING')}</p>
  }

  if (patientError || !patient) {
    return (
      <div className="max-w-xl">
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive mb-4">
          {t('PATIENT_NOT_FOUND')}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-primary hover:underline"
        >
          {t('ACTION_BACK')}
        </button>
      </div>
    )
  }

  const allergies = patient.knownAllergies
    ? patient.knownAllergies.split('|').join(', ')
    : null
  const medications = patient.currentMedications
    ? patient.currentMedications.split('|').join(', ')
    : null

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('PATIENT_FIND_ANOTHER')}
          </button>
          <span className="text-border">/</span>
          <span className="text-foreground font-medium">
            {patientDisplayName(patient)}
          </span>
        </div>
        <div className="flex gap-2">
          {!openVisit && (
            <Link
              to={`/visits/new?patient=${encodeURIComponent(clinicPatientID)}`}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {t('PATIENT_OPEN_VISIT')}
            </Link>
          )}
          <Link
            to={`/patients/${clinicPatientID}/edit`}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('PATIENT_EDIT')}
          </Link>
        </div>
      </div>

      {/* Current open visit banner */}
      {openVisit && (
        <div className="mb-4 rounded-md bg-primary/10 border border-primary/30 px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-medium text-primary">
            {t('PATIENT_CURRENT_VISIT_HEADING')}
          </p>
          <div className="flex gap-3">
            <Link
              to={`/visits/${openVisit.patientVisitID}/edit`}
              className="text-xs text-primary hover:underline"
            >
              {t('VISIT_LIST_ACTION_EDIT')}
            </Link>
            <Link
              to={`/visits/${openVisit.patientVisitID}/close`}
              className="text-xs text-destructive hover:underline"
            >
              {t('VISIT_LIST_ACTION_DISCHARGE')}
            </Link>
          </div>
        </div>
      )}

      {/* Personal info */}
      <Section title={t('PATIENT_PERSONAL_LABEL', 'Personal info')}>
        <InfoRow label={t('PATIENT_ID_LABEL')} value={patient.clinicPatientID} />
        <InfoRow label={t('PATIENT_NATIONAL_ID_LABEL')} value={patient.patientNationalID} />
        <InfoRow label={t('PATIENT_FAMILY_ID_LABEL')} value={patient.familyID} />
        <InfoRow label={t('PATIENT_BIRTHDATE_LABEL')} value={patient.birthDate} />
        <InfoRow label={t('PATIENT_SEX_LABEL')} value={patient.sex} />
        <InfoRow label={t('PATIENT_MARITAL_STATUS_LABEL')} value={patient.maritalStatus} />
        <InfoRow label={t('PATIENT_PROFESSION_LABEL')} value={patient.profession} />
        <InfoRow label={t('PATIENT_PREFERRED_LANGUAGE_LABEL')} value={patient.preferredLanguage} />
        <InfoRow label={t('PATIENT_RESPONSIBLE_PARTY_LABEL')} value={patient.responsibleParty} />
      </Section>

      {/* Contact + address */}
      <Section title={t('PATIENT_CONTACT_LABEL')}>
        <InfoRow label={t('PATIENT_PHONE_LABEL')} value={patient.contactPhone} />
        <InfoRow label={t('PATIENT_ALT_PHONE_LABEL')} value={patient.contactAltPhone} />
        <InfoRow
          label={t('PATIENT_ADDRESS_LABEL')}
          value={
            [patient.homeAddress1, patient.homeAddress2, patient.homeCity, patient.homeState]
              .filter(Boolean)
              .join(', ') || null
          }
        />
      </Section>

      {/* Medical */}
      <Section title={t('PATIENT_ALLERGIES_HEADING')}>
        <InfoRow
          label={t('PATIENT_ALLERGIES_HEADING')}
          value={allergies ?? <span className="text-muted-foreground italic">{t('PATIENT_NO_ALLERGIES')}</span>}
        />
        <InfoRow
          label={t('PATIENT_MEDICATIONS_HEADING')}
          value={medications ?? <span className="text-muted-foreground italic">{t('PATIENT_NO_MEDICATIONS')}</span>}
        />
        <InfoRow label={t('PATIENT_BLOODTYPE_LABEL')} value={patient.bloodType} />
      </Section>

      {/* Visit history */}
      <Section title={t('PATIENT_VISIT_HISTORY_HEADING')}>
        {visitsLoading && (
          <p className="text-sm text-muted-foreground">{t('LOADING')}</p>
        )}
        {!visitsLoading && closedVisits.length === 0 && !openVisit && (
          <p className="text-sm text-muted-foreground">
            {t('PATIENT_NO_PRIOR_VISITS')}
          </p>
        )}
        {!visitsLoading && (closedVisits.length > 0 || openVisit) && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left text-xs font-medium text-muted-foreground pr-4">
                  {t('VISIT_DATE_LABEL')}
                </th>
                <th className="pb-2 text-left text-xs font-medium text-muted-foreground pr-4">
                  {t('VISIT_COMPLAINT_PRIMARY_LABEL')}
                </th>
                <th className="pb-2 text-left text-xs font-medium text-muted-foreground pr-4">
                  {t('VISIT_ASSIGNED_LABEL')}
                </th>
                <th className="pb-2 text-left text-xs font-medium text-muted-foreground pr-4">
                  {t('VISIT_STATUS_LABEL')}
                </th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {openVisit && <VisitRow visit={openVisit} />}
              {closedVisits.map((v) => (
                <VisitRow key={v.patientVisitID} visit={v} />
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  )
}
