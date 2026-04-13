/**
 * VisitEditPage.tsx
 *
 * Edit an existing open visit. Matches v1 visitEdit.php.
 * Route: /visits/:id/edit
 *
 * Loads the visit via useVisit(patientVisitID), pre-populates all fields.
 * Submit: PATCH /api/v2/visits/:id
 * On success: navigate to /visits/:id (VisitDetailPage, Group 7)
 *
 * Vitals appear here for the multi-staff clinic workflow where a nurse
 * or assistant records vitals after the patient has been admitted.
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useVisit, updateVisit } from '@/api/visits'
import { useMedicalStaff, staffDisplayName } from '@/api/staff'
import ICD10Autocomplete from '@/components/ICD10Autocomplete'
import VitalsSection from '@/components/VitalsSection'

// ---------------------------------------------------------------------------
// Form values — same shape as VisitOpenPage
// ---------------------------------------------------------------------------

interface VisitEditFormValues {
  visitType:        string
  staffUsername:    string
  dateTimeIn:       string
  primaryComplaint: string
  secondaryComplaint: string
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
  diagnosis1:  string
  condition1:  string
  diagnosis2:  string
  condition2:  string
  diagnosis3:  string
  condition3:  string
  referredFrom: string
  referredTo:   string
}

const VISIT_TYPES = ['Outpatient', 'Emergency', 'Specialist'] as const

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VisitEditPage() {
  const { t, i18n } = useTranslation()
  const { id }       = useParams<{ id: string }>()
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'

  const patientVisitID = id ?? ''

  const { data: visit, isLoading } = useVisit(patientVisitID)
  const { data: staffList = [] }   = useMedicalStaff()

  const { register, handleSubmit, reset, setValue, setError,
          formState: { errors } } = useForm<VisitEditFormValues>()

  // Pre-populate form when visit loads
  useEffect(() => {
    if (!visit) return
    reset({
      visitType:         visit.visitType           ?? 'Outpatient',
      staffUsername:     visit.staffUsername        ?? '',
      dateTimeIn:        visit.dateTimeIn
                           ? visit.dateTimeIn.slice(0, 16).replace(' ', 'T')
                           : '',
      primaryComplaint:  visit.primaryComplaint     ?? '',
      secondaryComplaint: visit.secondaryComplaint  ?? '',
      height:      visit.height      != null ? String(visit.height)      : '',
      heightUnits: visit.heightUnits ?? 'cm',
      weight:      visit.weight      != null ? String(visit.weight)      : '',
      weightUnits: visit.weightUnits ?? 'kg',
      temp:        visit.temp        != null ? String(visit.temp)        : '',
      tempUnits:   visit.tempUnits   ?? 'C',
      bpSystolic:  visit.bpSystolic  != null ? String(visit.bpSystolic)  : '',
      bpDiastolic: visit.bpDiastolic != null ? String(visit.bpDiastolic) : '',
      pulse:       visit.pulse       != null ? String(visit.pulse)       : '',
      glucose:     visit.glucose     != null ? String(visit.glucose)     : '',
      glucoseUnits: visit.glucoseUnits ?? 'RBS',
      diagnosis1:  visit.diagnosis1  ?? '',
      condition1:  visit.condition1  ?? '',
      diagnosis2:  visit.diagnosis2  ?? '',
      condition2:  visit.condition2  ?? '',
      diagnosis3:  visit.diagnosis3  ?? '',
      condition3:  visit.condition3  ?? '',
      referredFrom: visit.referredFrom ?? '',
      referredTo:   visit.referredTo   ?? '',
    })
  }, [visit, reset])

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof updateVisit>[1]) =>
      updateVisit(patientVisitID, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', patientVisitID] })
      navigate(`/visits/${patientVisitID}`)
    },
    onError: () => {
      setError('root', { message: t('ERROR_GENERIC') })
    },
  })

  function onSubmit(values: VisitEditFormValues) {
    mutation.mutate({
      visitType:         values.visitType,
      staffUsername:     values.staffUsername     || null,
      dateTimeIn:        values.dateTimeIn
                           ? values.dateTimeIn.replace('T', ' ') + ':00'
                           : undefined,
      primaryComplaint:  values.primaryComplaint  || null,
      secondaryComplaint: values.secondaryComplaint || null,
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
      diagnosis1:  values.diagnosis1  || null,
      condition1:  values.condition1  || null,
      diagnosis2:  values.diagnosis2  || null,
      condition2:  values.condition2  || null,
      diagnosis3:  values.diagnosis3  || null,
      condition3:  values.condition3  || null,
      referredFrom: values.referredFrom || null,
      referredTo:   values.referredTo   || null,
    })
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('LOADING')}</p>
  }

  if (!visit) {
    return (
      <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
        {t('ERROR_NOT_FOUND')}
      </div>
    )
  }

  const isBusy = mutation.isPending

  return (
    <div className="max-w-2xl">

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">
          {t('VISIT_EDIT_TITLE')}
        </h1>
        <Link
          to={`/visits/${patientVisitID}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('VISIT_CANCEL')}
        </Link>
      </div>

      {/* Patient + visit summary */}
      <div className="mb-5 rounded-lg bg-muted/50 border border-border px-4 py-3 text-sm">
        <span className="font-medium text-foreground">
          {visit.patientFirstName} {visit.patientLastName}
        </span>
        <span className="ml-3 font-mono text-xs text-muted-foreground">
          {visit.clinicPatientID}
        </span>
        <span className="ml-3 text-muted-foreground">
          {visit.dateTimeIn
            ? new Date(visit.dateTimeIn).toLocaleDateString()
            : ''}
        </span>
      </div>

      {errors.root && (
        <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        <SectionHeader title={t('VISIT_DETAIL_TITLE')} />

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('VISIT_TYPE_LABEL')}
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

        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('VISIT_COMPLAINT_ADDITIONAL_LABEL')}
          </label>
          <textarea
            rows={3}
            placeholder={t('VISIT_ADDITIONAL_NOTES_PLACEHOLDER')}
            className={`${inputClass} resize-y`}
            {...register('secondaryComplaint')}
          />
        </div>

        <SectionHeader title={t('VISIT_PRECLINIC_HEADING')} />
        <VitalsSection register={register} />

        <SectionHeader title={t('VISIT_DIAGNOSES_HEADING')} />

        {([1, 2, 3] as const).map((n) => (
          <div key={n} className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              {t(`VISIT_DIAGNOSIS_${n}_LABEL`)}
            </label>
            <ICD10Autocomplete
              value={visit[`condition${n}` as 'condition1'] ?? ''}
              language={lang}
              placeholder={t('ICD_SEARCH_PLACEHOLDER')}
              onSelect={(code, description) => {
                setValue(`diagnosis${n}` as keyof VisitEditFormValues, description)
                setValue(`condition${n}` as keyof VisitEditFormValues, code)
              }}
            />
            <input type="hidden" {...register(`diagnosis${n}` as keyof VisitEditFormValues)} />
            <input type="hidden" {...register(`condition${n}` as keyof VisitEditFormValues)} />
          </div>
        ))}

        <SectionHeader title={t('VISIT_REFERRAL_HEADING')} />

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('VISIT_REFERRED_TO_LABEL')}
            </label>
            <input
              type="text"
              placeholder={t('VISIT_REFERRAL_TO_PLACEHOLDER')}
              className={inputClass}
              {...register('referredTo')}
            />
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3 border-t border-border pt-5">
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBusy ? t('LOADING') : t('VISIT_EDIT_ACTION')}
          </button>
          <Link
            to={`/visits/${patientVisitID}`}
            className="rounded-md border border-border px-5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('VISIT_CANCEL')}
          </Link>
        </div>

      </form>
    </div>
  )
}
