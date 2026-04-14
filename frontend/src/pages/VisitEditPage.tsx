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
<div>
      <PageActions>
        <PageActions.Link to={`/visits/${patientVisitID}`}>{t('VISIT_CANCEL')}</PageActions.Link>
      </PageActions>

      {/* nameBlock */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-8 mb-4">
        <div className="flex-1">
          <h1 className="text-xl font-medium text-foreground leading-tight">
            {visit.patientFirstName} {visit.patientLastName}
            <span className="text-sm font-normal text-muted-foreground ml-2">({visit.patientSex})</span>
          </h1>
          {visit.patientBirthDate && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {visit.patientBirthDate}&nbsp;&nbsp;
              <Link to={`/patients/${visit.clinicPatientID}`} className="text-primary hover:underline">
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
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{visit.patientVisitID}</p>
        </div>
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
        <div className="flex flex-col md:flex-row md:gap-8 md:items-start">

          {/* Left column: arrival + vitals */}
          <div className="flex-1 min-w-0">
            {/* ... visit type, staff, dateTimeIn, primaryComplaint, secondaryComplaint, VitalsSection ... */}
          </div>

          {/* Right column: diagnoses + referral */}
          <div className="flex-1 min-w-0">
            {/* ... ICD10Autocomplete fields, referredFrom, referredTo ... */}
          </div>

        </div>

        {/* Actions row — full width below both columns */}
        <div className="mt-8 flex items-center gap-3 border-t border-border pt-5">
          ...
        </div>
      </form>
    </div>
  )
}
