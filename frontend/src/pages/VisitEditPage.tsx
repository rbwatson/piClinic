/**
 * VisitEditPage.tsx
 *
 * Edit an existing open visit. Matches v1 visitEdit.php.
 * Route: /visits/:id/edit
 *
 * Layout:
 *   - PageActions strip: Cancel
 *   - NameBlock: patient name + DOB + patient ID | visit date + visit ID
 *   - Two-column responsive form:
 *       Left:  SectionHeading + visit type/staff/arrival + complaints + VitalsSection
 *       Right: SectionHeading + DiagnosisField x3 + referral fields
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
import VitalsSection    from '@/components/VitalsSection'
import DiagnosisField   from '@/components/DiagnosisField'
import PageActions      from '@/components/PageActions'
import NameBlock        from '@/components/NameBlock'
import SectionHeading   from '@/components/SectionHeading'
import TwoColumnLayout  from '@/components/TwoColumnLayout'

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

  const { register, handleSubmit, reset, setValue, watch, setError,
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
    return <p className="loading-state">{t('LOADING')}</p>
  }

  if (!visit) {
    return (
      <div className="error-banner"><p>{t('ERROR_NOT_FOUND')}</p></div>
    )
  }

  const isBusy = mutation.isPending
  const patientName = `${visit.patientLastName}, ${visit.patientFirstName}`

  const leftColumn = (
    <>
      <SectionHeading title={t('VISIT_DETAIL_TITLE')} />

      <div style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="visitType" className="diagnosis-field-label">{t('VISIT_TYPE_LABEL')}</label>
        <select id="visitType" className={selectClass} {...register('visitType')}>
          {VISIT_TYPES.map((vt) => (
            <option key={vt} value={vt}>
              {t(`VISIT_TYPE_${vt.toUpperCase()}`, vt)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="staffUsername" className="diagnosis-field-label">{t('VISIT_ASSIGNED_LABEL')}</label>
        <select id="staffUsername" className={selectClass} {...register('staffUsername')}>
          <option value="">{t('STAFF_SELECT_PLACEHOLDER')}</option>
          {staffList.map((s) => (
            <option key={s.username} value={s.username}>
              {staffDisplayName(s)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="dateTimeIn" className="diagnosis-field-label">{t('VISIT_ARRIVED_LABEL')}</label>
        <input id="dateTimeIn" type="datetime-local" className={inputClass}
          {...register('dateTimeIn')} />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="primaryComplaint" className="diagnosis-field-label">{t('VISIT_COMPLAINT_PRIMARY_LABEL')}</label>
        <textarea id="primaryComplaint" rows={3}
          placeholder={t('VISIT_COMPLAINT_PLACEHOLDER')}
          className={`${inputClass} resize-y`}
          {...register('primaryComplaint')} />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="secondaryComplaint" className="diagnosis-field-label">{t('VISIT_COMPLAINT_ADDITIONAL_LABEL')}</label>
        <textarea id="secondaryComplaint" rows={3}
          placeholder={t('VISIT_ADDITIONAL_NOTES_PLACEHOLDER')}
          className={`${inputClass} resize-y`}
          {...register('secondaryComplaint')} />
      </div>

      <SectionHeading title={t('VISIT_PRECLINIC_HEADING')} />
      <VitalsSection register={register} />
    </>
  )

  const rightColumn = (
    <>
      <SectionHeading title={t('VISIT_DIAGNOSES_HEADING')} />

      {([1, 2, 3] as const).map((n) => (
        <DiagnosisField
          key={n}
          n={n}
          language={lang}
          conditionValue={watch(`condition${n}` as keyof VisitEditFormValues) ?? ''}
          icdValue={watch(`condition${n}` as keyof VisitEditFormValues) ?? ''}
          onConditionChange={(val) =>
            setValue(`condition${n}` as keyof VisitEditFormValues, val)
          }
          onIcdSelect={(code, desc) => {
            setValue(`condition${n}` as keyof VisitEditFormValues, code)
            setValue(`diagnosis${n}` as keyof VisitEditFormValues, desc)
          }}
        />
      ))}

      {/* Hidden fields so react-hook-form tracks diagnosis descriptions */}
      {([1, 2, 3] as const).map((n) => (
        <input key={n} type="hidden"
          {...register(`diagnosis${n}` as keyof VisitEditFormValues)} />
      ))}

      <SectionHeading title={t('VISIT_REFERRAL_HEADING')} />

      <div style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="referredFrom" className="diagnosis-field-label">{t('VISIT_REFERRED_FROM_LABEL')}</label>
        <input id="referredFrom" type="text"
          placeholder={t('VISIT_REFERRAL_FROM_PLACEHOLDER')}
          className={inputClass} {...register('referredFrom')} />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="referredTo" className="diagnosis-field-label">{t('VISIT_REFERRED_TO_LABEL')}</label>
        <input id="referredTo" type="text"
          placeholder={t('VISIT_REFERRAL_TO_PLACEHOLDER')}
          className={inputClass} {...register('referredTo')} />
      </div>
    </>
  )

  return (
    <div>
      <PageActions>
        <PageActions.Link to={`/visits/${patientVisitID}`}>{t('VISIT_CANCEL')}</PageActions.Link>
      </PageActions>

      <NameBlock
        patientName={patientName}
        patientSex={visit.patientSex ?? ''}
        patientDOB={visit.patientBirthDate}
        patientID={visit.clinicPatientID}
        visitDate={visit.dateTimeIn ? new Date(visit.dateTimeIn).toLocaleString() : null}
        visitID={visit.patientVisitID}
      />

      {errors.root && (
        <div className="error-banner"><p>{errors.root.message}</p></div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <TwoColumnLayout left={leftColumn} right={rightColumn} />

        {/* Actions — full width */}
        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #ccc', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
