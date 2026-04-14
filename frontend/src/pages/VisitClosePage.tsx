/**
 * VisitClosePage.tsx
 *
 * Discharge a patient. Matches v1 visitClose.php.
 * Route: /visits/:id/close
 *
 * Shows a read-only summary of the visit and a payment field.
 * The user can update any field before confirming discharge.
 * Submit: PATCH /api/v2/visits/:id with visitStatus='Closed',
 *         dateTimeOut=now, plus any edited fields.
 * On success: navigate to /patients/:clinicPatientID
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

interface VisitCloseFormValues {
  staffUsername:    string
  primaryComplaint: string
  secondaryComplaint: string
  payment:          string
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
  referredTo:  string
}

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ' +
  'text-foreground placeholder:text-muted-foreground focus:outline-none ' +
  'focus:ring-2 focus:ring-ring disabled:opacity-50'

const selectClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ' +
  'text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-border last:border-0">
      <span className="w-36 flex-shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value || '—'}</span>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-semibold text-foreground mt-6 mb-3 pb-1 border-b border-border">
      {title}
    </h2>
  )
}

export default function VisitClosePage() {
  const { t, i18n } = useTranslation()
  const { id }       = useParams<{ id: string }>()
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'

  const patientVisitID = id ?? ''

  const { data: visit, isLoading } = useVisit(patientVisitID)
  const { data: staffList = [] }   = useMedicalStaff()

  const { register, handleSubmit, reset, setValue, setError,
          formState: { errors } } = useForm<VisitCloseFormValues>()

  useEffect(() => {
    if (!visit) return
    reset({
      staffUsername:      visit.staffUsername     ?? '',
      primaryComplaint:   visit.primaryComplaint  ?? '',
      secondaryComplaint: visit.secondaryComplaint ?? '',
      payment:            visit.payment           ?? '',
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
      referredTo:  visit.referredTo  ?? '',
    })
  }, [visit, reset])

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof updateVisit>[1]) =>
      updateVisit(patientVisitID, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      queryClient.invalidateQueries({ queryKey: ['patients', visit?.clinicPatientID] })
      navigate(`/patients/${visit?.clinicPatientID}`)
    },
    onError: () => {
      setError('root', { message: t('ERROR_GENERIC') })
    },
  })

  function onSubmit(values: VisitCloseFormValues) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    mutation.mutate({
      visitStatus:       'Closed',
      dateTimeOut:       now,
      staffUsername:     values.staffUsername     || null,
      primaryComplaint:  values.primaryComplaint  || null,
      secondaryComplaint: values.secondaryComplaint || null,
      payment:           values.payment           || null,
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
      referredTo:  values.referredTo  || null,
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
          {t('VISIT_CLOSE_TITLE')}
        </h1>
        <Link
          to={`/visits/${patientVisitID}/edit`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('VISIT_CANCEL')}
        </Link>
      </div>

      {/* Read-only arrival summary — gray box like v1 */}
      <div className="bg-muted border border-border rounded px-4 py-3 mb-4 text-sm">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>
            <span className="font-semibold text-xs">{t('VISIT_ARRIVED_LABEL')}:</span>{' '}
            {visit.dateTimeIn ? new Date(visit.dateTimeIn).toLocaleString() : '—'}
          </span>
          <span>
            <span className="font-semibold text-xs">{t('VISIT_TYPE_LABEL')}:</span>{' '}
            {visit.visitType}
          </span>
          {visit.primaryComplaint && (
            <span>
              <span className="font-semibold text-xs">{t('VISIT_COMPLAINT_PRIMARY_LABEL')}:</span>{' '}
              {visit.primaryComplaint}
            </span>
          )}
        </div>
        {/* Vitals read-only row */}
        {(visit.height || visit.weight || visit.temp || visit.bpSystolic || visit.pulse) && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {visit.height && <span>{t('VISIT_HEIGHT_LABEL')}: {visit.height} {visit.heightUnits}</span>}
            {visit.weight && <span>{t('VISIT_WEIGHT_LABEL')}: {visit.weight} {visit.weightUnits}</span>}
            {visit.temp   && <span>{t('VISIT_TEMP_LABEL')}: {visit.temp}° {visit.tempUnits}</span>}
            {visit.bpSystolic && <span>{t('VISIT_BP_LABEL')}: {visit.bpSystolic}/{visit.bpDiastolic}</span>}
            {visit.pulse  && <span>{t('VISIT_PULSE_LABEL')}: {visit.pulse}</span>}
          </div>
        )}
      </div>

      {/* Discharge confirmation banner */}
      <div className="mb-5 rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive font-medium">
        {t('VISIT_CLOSE_CONFIRM', 'Confirm discharge — this will close the visit.')}
      </div>

      {errors.root && (
        <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        <SectionHeader title={t('VISIT_DISCHARGE_HEADING', 'Discharge info')} />

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
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
              {t('VISIT_PAYMENT_LABEL')}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder={t('VISIT_PAYMENT_PLACEHOLDER')}
              className={inputClass}
              {...register('payment')}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('VISIT_COMPLAINT_PRIMARY_LABEL')}
          </label>
          <textarea
            rows={2}
            className={`${inputClass} resize-y`}
            {...register('primaryComplaint')}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('VISIT_ASSESSMENT_LABEL')}
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
                setValue(`diagnosis${n}` as keyof VisitCloseFormValues, description)
                setValue(`condition${n}` as keyof VisitCloseFormValues, code)
              }}
            />
            <input type="hidden" {...register(`diagnosis${n}` as keyof VisitCloseFormValues)} />
            <input type="hidden" {...register(`condition${n}` as keyof VisitCloseFormValues)} />
          </div>
        ))}

        <SectionHeader title={t('VISIT_REFERRAL_HEADING')} />

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

        <div className="mt-8 flex items-center gap-3 border-t border-border pt-5">
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-md bg-destructive px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBusy ? t('LOADING') : t('VISIT_CLOSE_ACTION')}
          </button>
          <Link
            to={`/visits/${patientVisitID}/edit`}
            className="rounded-md border border-border px-5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('VISIT_CANCEL')}
          </Link>
        </div>

      </form>
    </div>
  )
}
