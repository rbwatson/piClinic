/**
 * VisitEditPage.tsx
 *
 * Edit an existing open visit. Matches v1 visitEdit.php.
 * Route: /visits/:id/edit
 *
 * Layout:
 *   - PageActions strip: Cancel
 *   - nameBlock: patient name + DOB + patient ID | visit date + visit ID
 *   - Two-column responsive form at md:
 *       Left:  visit type, staff, arrival time, complaints, vitals
 *       Right: diagnoses (ICD10Autocomplete), referral fields
 *   - Full-width actions row
 *
 * Submit: PATCH /api/v2/visits/:id -> navigate to /visits/:id
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
import PageActions from '@/components/PageActions'

// ---------------------------------------------------------------------------
// Form values
// ---------------------------------------------------------------------------

interface VisitEditFormValues {
  visitType:          string
  staffUsername:      string
  dateTimeIn:         string
  primaryComplaint:   string
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
  'w-full rounded border border-input bg-background px-3 py-2 text-sm ' +
  'text-foreground placeholder:text-muted-foreground focus:outline-none ' +
  'focus:ring-2 focus:ring-ring disabled:opacity-50'

const selectClass =
  'w-full rounded border border-input bg-background px-3 py-2 text-sm ' +
  'text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

function FieldLabel({ text, htmlFor }: { text: string; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-foreground mb-1">
      {text}
    </label>
  )
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-base font-medium text-foreground mt-4 mb-2 pb-1 border-b border-border">
      {title}
    </h2>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VisitEditPage() {
  const { t, i18n } = useTranslation()
  const { id }      = useParams<{ id: string }>()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'

  const patientVisitID = id ?? ''

  const { data: visit, isLoading } = useVisit(patientVisitID)
  const { data: staffList = [] }   = useMedicalStaff()

  const { register, handleSubmit, reset, setValue, setError,
          formState: { errors } } = useForm<VisitEditFormValues>()

  useEffect(() => {
    if (!visit) return
    reset({
      visitType:          visit.visitType           ?? 'Outpatient',
      staffUsername:      visit.staffUsername        ?? '',
      dateTimeIn:         visit.dateTimeIn
                            ? visit.dateTimeIn.slice(0, 16).replace(' ', 'T')
                            : '',
      primaryComplaint:   visit.primaryComplaint     ?? '',
      secondaryComplaint: visit.secondaryComplaint   ?? '',
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
      visitType:          values.visitType,
      staffUsername:      values.staffUsername      || null,
      dateTimeIn:         values.dateTimeIn
                            ? values.dateTimeIn.replace('T', ' ') + ':00'
                            : undefined,
      primaryComplaint:   values.primaryComplaint   || null,
      secondaryComplaint: values.secondaryComplaint || null,
      height:      values.height      ? parseFloat(values.height)    : null,
      heightUnits: values.height      ? values.heightUnits           : null,
      weight:      values.weight      ? parseFloat(values.weight)    : null,
      weightUnits: values.weight      ? values.weightUnits           : null,
      temp:        values.temp        ? parseFloat(values.temp)      : null,
      tempUnits:   values.temp        ? values.tempUnits             : null,
      bpSystolic:  values.bpSystolic  ? parseInt(values.bpSystolic)  : null,
      bpDiastolic: values.bpDiastolic ? parseInt(values.bpDiastolic) : null,
      pulse:       values.pulse       ? parseInt(values.pulse)       : null,
      glucose:     values.glucose     ? parseInt(values.glucose)     : null,
      glucoseUnits: values.glucose    ? values.glucoseUnits          : null,
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
      <div className="rounded bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
        {t('ERROR_NOT_FOUND')}
      </div>
    )
  }

  const isBusy = mutation.isPending

  return (
    <div>
      {/* PageActions */}
      <PageActions>
        <PageActions.Link to={`/visits/${patientVisitID}`}>{t('VISIT_CANCEL')}</PageActions.Link>
      </PageActions>

      {/* nameBlock */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-8 mb-4">
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
              <Link
                to={`/patients/${visit.clinicPatientID}`}
                className="text-primary hover:underline"
              >
                {visit.clinicPatientID}
              </Link>
            </p>
          )}
        </div>
        <div className="mt-1 sm:mt-0 sm:text-right flex-shrink-0">
          <p className="text-sm text-foreground">
            <span className="font-semibold text-xs">{t('VISIT_DATE_LABEL')}:</span>{' '}
            {visit.dateTimeIn ? new Date(visit.dateTimeIn).toLocaleString() : ''}
          </p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {visit.patientVisitID}
          </p>
        </div>
      </div>

      {/* Root error */}
      {errors.root && (
        <div className="mb-4 rounded bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col md:flex-row md:gap-8 md:items-start">

          {/* Left column: arrival info + vitals */}
          <div className="flex-1 min-w-0">
            <SectionHeading title={t('VISIT_DETAIL_TITLE')} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="visitType" text={t('VISIT_TYPE_LABEL')} />
                <select id="visitType" className={selectClass} {...register('visitType')}>
                  {VISIT_TYPES.map((vt) => (
                    <option key={vt} value={vt}>
                      {t(`VISIT_TYPE_${vt.toUpperCase()}`, vt)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel htmlFor="staffUsername" text={t('VISIT_ASSIGNED_LABEL')} />
                <select id="staffUsername" className={selectClass} {...register('staffUsername')}>
                  <option value="">{t('STAFF_SELECT_PLACEHOLDER')}</option>
                  {staffList.map((s) => (
                    <option key={s.username} value={s.username}>
                      {staffDisplayName(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel htmlFor="dateTimeIn" text={t('VISIT_ARRIVED_LABEL')} />
                <input
                  id="dateTimeIn"
                  type="datetime-local"
                  className={inputClass}
                  {...register('dateTimeIn')}
                />
              </div>
            </div>

            <div className="mt-3">
              <FieldLabel htmlFor="primaryComplaint" text={t('VISIT_COMPLAINT_PRIMARY_LABEL')} />
              <textarea
                id="primaryComplaint"
                rows={3}
                placeholder={t('VISIT_COMPLAINT_PLACEHOLDER')}
                className={`${inputClass} resize-y`}
                {...register('primaryComplaint')}
              />
            </div>

            <div className="mt-3">
              <FieldLabel htmlFor="secondaryComplaint" text={t('VISIT_COMPLAINT_ADDITIONAL_LABEL')} />
              <textarea
                id="secondaryComplaint"
                rows={3}
                placeholder={t('VISIT_ADDITIONAL_NOTES_PLACEHOLDER')}
                className={`${inputClass} resize-y`}
                {...register('secondaryComplaint')}
              />
            </div>

            <SectionHeading title={t('VISIT_PRECLINIC_HEADING')} />
            <VitalsSection register={register} />
          </div>

          {/* Right column: diagnoses + referral */}
          <div className="flex-1 min-w-0 mt-6 md:mt-0">
            <SectionHeading title={t('VISIT_DIAGNOSES_HEADING')} />

            {([1, 2, 3] as const).map((n) => (
              <div key={n} className="mb-4">
                <FieldLabel
                  htmlFor={`diagnosis${n}`}
                  text={t(`VISIT_DIAGNOSIS_${n}_LABEL`)}
                />
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

            <SectionHeading title={t('VISIT_REFERRAL_HEADING')} />

            <div className="mb-3">
              <FieldLabel htmlFor="referredFrom" text={t('VISIT_REFERRED_FROM_LABEL')} />
              <input
                id="referredFrom"
                type="text"
                placeholder={t('VISIT_REFERRAL_FROM_PLACEHOLDER')}
                className={inputClass}
                {...register('referredFrom')}
              />
            </div>

            <div className="mb-3">
              <FieldLabel htmlFor="referredTo" text={t('VISIT_REFERRED_TO_LABEL')} />
              <input
                id="referredTo"
                type="text"
                placeholder={t('VISIT_REFERRAL_TO_PLACEHOLDER')}
                className={inputClass}
                {...register('referredTo')}
              />
            </div>
          </div>

        </div>

        {/* Actions — full width */}
        <div className="mt-8 flex items-center gap-3 border-t border-border pt-5">
          <button
            type="submit"
            disabled={isBusy}
            className="rounded bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBusy ? t('LOADING') : t('VISIT_EDIT_ACTION')}
          </button>
          <Link
            to={`/visits/${patientVisitID}`}
            className="rounded border border-border px-5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('VISIT_CANCEL')}
          </Link>
        </div>

      </form>
    </div>
  )
}
