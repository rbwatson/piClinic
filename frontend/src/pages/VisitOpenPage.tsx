/**
 * VisitOpenPage.tsx
 *
 * Open a new visit for a patient. Matches v1 visitOpen.php.
 * Route: /visits/new?patient=:clinicPatientID
 *
 * The ?patient= param is set by PatientDetailPage's "Admit" button.
 * If absent, shows an inline patient ID input.
 *
 * Fields:
 *   Visit type, staff assignment, arrival time, primary complaint,
 *   vitals (pre-clinic: height, weight, temp, BP, pulse, glucose),
 *   diagnoses 1-3 (ICD10Autocomplete), referral from.
 *
 * Vitals appear here because some clinics capture them at admission
 * (single-staff) and others at triage (multi-staff). They also appear
 * on VisitEditPage for the multi-staff workflow.
 *
 * On submit: POST /api/v2/visits → navigate to /visits/:patientVisitID/edit
 */

import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createVisit } from '@/api/visits'
import { useMedicalStaff, staffDisplayName } from '@/api/staff'
import { usePatient } from '@/api/patients'
import { patientDisplayName } from '@/lib/patientForm.utils'
import ICD10Autocomplete from '@/components/ICD10Autocomplete'
import type { Visit } from '@/api/visits'
import VitalsSection from '@/components/VitalsSection'
import PageActions from '@/components/PageActions'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VISIT_TYPES = ['Outpatient', 'Emergency', 'Specialist'] as const

// ---------------------------------------------------------------------------
// Form values
// ---------------------------------------------------------------------------

interface VisitOpenFormValues {
  clinicPatientID:  string
  visitType:        string
  staffUsername:    string
  dateTimeIn:       string
  primaryComplaint: string
  // Vitals
  height:      string
  heightUnits: string
  weight:      string
  weightUnits: string
  temp:        string
  tempUnits:   string
  bpSystolic:  string
  bpDiastolic: string
  pulse:       string
  glucose:     string
  glucoseUnits: string
  // Diagnoses
  diagnosis1: string
  condition1: string
  diagnosis2: string
  condition2: string
  diagnosis3: string
  condition3: string
  // Referral
  referredFrom: string
}

function nowLocalDateTimeString(): string {
  const d = new Date()
  d.setSeconds(0, 0)
  return d.toISOString().slice(0, 16)
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ' +
  'text-foreground placeholder:text-muted-foreground focus:outline-none ' +
  'focus:ring-2 focus:ring-ring disabled:opacity-50'

const selectClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ' +
  'text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-semibold text-foreground mt-6 mb-3 pb-1 border-b border-border">
      {title}
    </h2>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VisitOpenPage() {
  const { t, i18n } = useTranslation()
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const [searchParams] = useSearchParams()

  const patientParam = searchParams.get('patient') ?? ''
  const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'

  const { data: patient, isLoading: patientLoading } = usePatient(patientParam)
  const { data: staffList = [] } = useMedicalStaff()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    setError,
  } = useForm<VisitOpenFormValues>({
    defaultValues: {
      clinicPatientID: patientParam,
      visitType:       'Outpatient',
      staffUsername:   '',
      dateTimeIn:      nowLocalDateTimeString(),
      primaryComplaint: '',
      height: '', heightUnits: 'cm',
      weight: '', weightUnits: 'kg',
      temp:   '', tempUnits:   'C',
      bpSystolic: '', bpDiastolic: '', pulse: '',
      glucose: '', glucoseUnits: 'RBS',
      diagnosis1: '', condition1: '',
      diagnosis2: '', condition2: '',
      diagnosis3: '', condition3: '',
      referredFrom: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: Partial<Visit> & { clinicPatientID: string; visitType: string }) =>
      createVisit(data),
    onSuccess: (visit) => {
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      navigate(`/visits/${visit.patientVisitID}/edit`)
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 404) {
        setError('clinicPatientID', { message: t('PATIENT_NOT_FOUND') })
      } else {
        setError('root', { message: t('ERROR_GENERIC') })
      }
    },
  })

  function onSubmit(values: VisitOpenFormValues) {
    const payload = {
      clinicPatientID:  values.clinicPatientID.trim(),
      visitType:        values.visitType,
      staffUsername:    values.staffUsername || undefined,
      dateTimeIn:       values.dateTimeIn
                          ? new Date(values.dateTimeIn).toISOString().slice(0, 19).replace('T', ' ')
                          : undefined,
      primaryComplaint: values.primaryComplaint || null,
      // Vitals — only include if non-empty
      height:      values.height      ? parseFloat(values.height)      : null,
      heightUnits: values.height      ? values.heightUnits             : null,
      weight:      values.weight      ? parseFloat(values.weight)      : null,
      weightUnits: values.weight      ? values.weightUnits             : null,
      temp:        values.temp        ? parseFloat(values.temp)        : null,
      tempUnits:   values.temp        ? values.tempUnits               : null,
      bpSystolic:  values.bpSystolic  ? parseInt(values.bpSystolic)    : null,
      bpDiastolic: values.bpDiastolic ? parseInt(values.bpDiastolic)   : null,
      pulse:       values.pulse       ? parseInt(values.pulse)         : null,
      glucose:     values.glucose     ? parseInt(values.glucose)       : null,
      glucoseUnits: values.glucose    ? values.glucoseUnits            : null,
      // Diagnoses
      diagnosis1: values.diagnosis1 || null,
      condition1: values.condition1 || null,
      diagnosis2: values.diagnosis2 || null,
      condition2: values.condition2 || null,
      diagnosis3: values.diagnosis3 || null,
      condition3: values.condition3 || null,
      referredFrom: values.referredFrom || null,
    }
    mutation.mutate(payload as Parameters<typeof createVisit>[0])
  }

  const isBusy = mutation.isPending

  return (
<div>
      {/* PageActions */}
      <PageActions>
        <PageActions.Link to={patientParam ? `/patients/${patientParam}` : '/patients'}>
          {t('VISIT_CANCEL')}
        </PageActions.Link>
      </PageActions>

      {/* nameBlock */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-8 mb-4">
        <div className="flex-1">
          {patientLoading ? (
            <p className="text-sm text-muted-foreground">{t('LOADING')}</p>
          ) : patient ? (
            <>
              <h1 className="text-xl font-medium text-foreground leading-tight">
                {patientDisplayName(patient)}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({patient.sex})
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {patient.birthDate}&nbsp;&nbsp;
                <Link to={`/patients/${patientParam}`} className="text-primary hover:underline">
                  {patient.clinicPatientID}
                </Link>
              </p>
            </>
          ) : (
            <p className="text-sm text-destructive">{t('PATIENT_NOT_FOUND')}</p>
          )}
        </div>
        <div className="mt-1 sm:mt-0 sm:text-right flex-shrink-0">
          <p className="text-sm text-foreground">
            <span className="font-semibold text-xs">{t('VISIT_DATE_LABEL')}:</span>{' '}
            {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
      
      {/* Patient summary */}
      {patientParam && (
        <div className="mb-5 rounded-lg bg-muted/50 border border-border px-4 py-3 text-sm">
          {patientLoading ? (
            <span className="text-muted-foreground">{t('LOADING')}</span>
          ) : patient ? (
            <span className="font-medium text-foreground">
              {patientDisplayName(patient)}{' '}
              <span className="font-normal text-muted-foreground font-mono text-xs">
                {patient.clinicPatientID}
              </span>
            </span>
          ) : (
            <span className="text-destructive">{t('PATIENT_NOT_FOUND')}</span>
          )}
        </div>
      )}

      {/* Root error */}
      {errors.root && (
        <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* ── Visit info ── */}
        <SectionHeader title={t('VISIT_DETAIL_TITLE')} />

        {/* Patient ID — shown only when not passed via URL */}
        {!patientParam && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('PATIENT_ID_LABEL')} <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              className={inputClass}
              {...register('clinicPatientID', {
                validate: (v) => !!v.trim() || t('ERROR_REQUIRED_FIELD'),
              })}
            />
            <FieldError message={errors.clinicPatientID?.message} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('VISIT_TYPE_LABEL')} <span className="text-destructive">*</span>
            </label>
            <select className={selectClass} {...register('visitType')}>
              {VISIT_TYPES.map((vt) => (
                <option key={vt} value={vt}>
                  {t(`VISIT_TYPE_${vt.toUpperCase()}`, vt)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('VISIT_ASSIGNED_LABEL')}
            </label>
            <select className={selectClass} {...register('staffUsername')}>
              <option value="">{t('STAFF_SELECT_PLACEHOLDER')}</option>
              {staffList.map((s) => (
                <option key={s.username} value={s.username}>
                  {staffDisplayName(s)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('VISIT_ARRIVED_LABEL')}
            </label>
            <input
              type="datetime-local"
              className={inputClass}
              {...register('dateTimeIn')}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('VISIT_COMPLAINT_PRIMARY_LABEL')}
          </label>
          <textarea
            rows={3}
            placeholder={t('VISIT_COMPLAINT_PLACEHOLDER')}
            className={`${inputClass} resize-y`}
            {...register('primaryComplaint')}
          />
        </div>

        {/* ── Pre-clinic vitals ── */}
        <SectionHeader title={t('VISIT_PRECLINIC_HEADING')} />
        <VitalsSection register={register} />

        {/* ── Diagnoses ── */}
        <SectionHeader title={t('VISIT_DIAGNOSES_HEADING')} />

        {([1, 2, 3] as const).map((n) => (
          <div key={n} className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              {t(`VISIT_DIAGNOSIS_${n}_LABEL`)}
            </label>
            <ICD10Autocomplete
              value={''}
              language={lang}
              placeholder={t('ICD_SEARCH_PLACEHOLDER')}
              onSelect={(code, description) => {
                setValue(`diagnosis${n}` as keyof VisitOpenFormValues, description)
                setValue(`condition${n}` as keyof VisitOpenFormValues, code)
              }}
            />
            {/* Hidden fields carry the selected code/description */}
            <input type="hidden" {...register(`diagnosis${n}` as keyof VisitOpenFormValues)} />
            <input type="hidden" {...register(`condition${n}` as keyof VisitOpenFormValues)} />
          </div>
        ))}

        {/* ── Referral ── */}
        <SectionHeader title={t('VISIT_REFERRAL_HEADING')} />

        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('VISIT_REFERRED_FROM_LABEL')}
          </label>
          <input
            type="text"
            placeholder={t('VISIT_REFERRAL_FROM_PLACEHOLDER')}
            className={inputClass}
            {...register('referredFrom')}
          />
        </div>

        {/* ── Actions ── */}
        <div className="mt-8 flex items-center gap-3 border-t border-border pt-5">
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBusy ? t('LOADING') : t('VISIT_OPEN_ACTION')}
          </button>
        </div>

      </form>
    </div>
  )
}
