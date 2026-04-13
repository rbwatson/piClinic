/**
 * PatientFormPage.tsx
 *
 * Patient create and edit form. Matches v1 ptAddEdit.php.
 * Mounted at two routes:
 *   /patients/new        — create mode (POST /api/v2/patients)
 *   /patients/:id/edit   — edit mode   (PATCH /api/v2/patients/:id)
 *
 * Mode is detected from the presence of the :id route param.
 * In edit mode the form pre-loads patient data via usePatient().
 *
 * Validation (client-side mirrors backend):
 *   Required: clinicPatientID (create only), lastName, firstName, sex
 *   Enums:    sex (M/F/X), bloodType, maritalStatus
 *
 * Allergies and medications:
 *   Stored as pipe-separated strings in the DB.
 *   Display: join '|' with newlines.
 *   Save:    split on newlines, trim, filter empty, join with '|'.
 *   No further validation — free text, one entry per line.
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  usePatient,
  createPatient,
  updatePatient,
  type Patient,
} from '@/api/patients'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEX_OPTIONS = ['', 'M', 'F', 'X'] as const
const BLOOD_TYPE_OPTIONS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'NA'] as const
const MARITAL_OPTIONS = [
  '',
  'Single',
  'Married',
  'LivingTogether',
  'Engaged',
  'Divorced',
  'Separated',
  'Widowed',
  'Other',
] as const

// ---------------------------------------------------------------------------
// Form value type
// Textareas use newline-separated strings for allergies/medications.
// ---------------------------------------------------------------------------

interface PatientFormValues {
  clinicPatientID:    string
  patientNationalID:  string
  familyID:           string
  lastName:           string
  lastName2:          string
  firstName:          string
  middleInitial:      string
  sex:                string
  birthDate:          string
  maritalStatus:      string
  profession:         string
  preferredLanguage:  string
  organDonor:         string   // '1' | '0' | ''
  responsibleParty:   string
  homeAddress1:       string
  homeAddress2:       string
  homeNeighborhood:   string
  homeCity:           string
  homeCounty:         string
  homeState:          string
  contactPhone:       string
  contactAltPhone:    string
  bloodType:          string
  nextVaccinationDate: string
  knownAllergies:     string   // newline-separated
  currentMedications: string   // newline-separated
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert pipe-separated DB string to newline-separated textarea value */
function pipeToLines(value: string | null): string {
  if (!value) return ''
  return value.split('|').join('\n')
}

/** Convert newline-separated textarea value to pipe-separated DB string */
function linesToPipe(value: string): string | null {
  const lines = value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  return lines.length > 0 ? lines.join('|') : null
}

/** Map a Patient record to form default values */
function patientToForm(p: Patient): PatientFormValues {
  return {
    clinicPatientID:    p.clinicPatientID,
    patientNationalID:  p.patientNationalID   ?? '',
    familyID:           p.familyID            ?? '',
    lastName:           p.lastName,
    lastName2:          p.lastName2           ?? '',
    firstName:          p.firstName,
    middleInitial:      p.middleInitial       ?? '',
    sex:                p.sex                 ?? '',
    birthDate:          p.birthDate           ?? '',
    maritalStatus:      p.maritalStatus       ?? '',
    profession:         p.profession          ?? '',
    preferredLanguage:  p.preferredLanguage   ?? '',
    organDonor:         p.organDonor != null   ? String(p.organDonor) : '',
    responsibleParty:   p.responsibleParty    ?? '',
    homeAddress1:       p.homeAddress1        ?? '',
    homeAddress2:       p.homeAddress2        ?? '',
    homeNeighborhood:   p.homeNeighborhood    ?? '',
    homeCity:           p.homeCity            ?? '',
    homeCounty:         p.homeCounty          ?? '',
    homeState:          p.homeState           ?? '',
    contactPhone:       p.contactPhone        ?? '',
    contactAltPhone:    p.contactAltPhone     ?? '',
    bloodType:          p.bloodType           ?? '',
    nextVaccinationDate: p.nextVaccinationDate ?? '',
    knownAllergies:     pipeToLines(p.knownAllergies),
    currentMedications: pipeToLines(p.currentMedications),
  }
}

const EMPTY_FORM: PatientFormValues = {
  clinicPatientID: '', patientNationalID: '', familyID: '',
  lastName: '', lastName2: '', firstName: '', middleInitial: '',
  sex: '', birthDate: '', maritalStatus: '', profession: '',
  preferredLanguage: '', organDonor: '', responsibleParty: '',
  homeAddress1: '', homeAddress2: '', homeNeighborhood: '',
  homeCity: '', homeCounty: '', homeState: '',
  contactPhone: '', contactAltPhone: '',
  bloodType: '', nextVaccinationDate: '',
  knownAllergies: '', currentMedications: '',
}

/** Map form values back to the Patient partial sent to the API */
function formToPatient(values: PatientFormValues): Partial<Patient> {
  return {
    clinicPatientID:    values.clinicPatientID    || undefined,
    patientNationalID:  values.patientNationalID  || null,
    familyID:           values.familyID           || null,
    lastName:           values.lastName,
    lastName2:          values.lastName2          || null,
    firstName:          values.firstName,
    middleInitial:      values.middleInitial      || null,
    sex:                (values.sex as Patient['sex']) || undefined,
    birthDate:          values.birthDate          || null,
    maritalStatus:      values.maritalStatus      || null,
    profession:         values.profession         || null,
    preferredLanguage:  values.preferredLanguage  || null,
    organDonor:         values.organDonor !== ''   ? Number(values.organDonor) : null,
    responsibleParty:   values.responsibleParty   || null,
    homeAddress1:       values.homeAddress1       || null,
    homeAddress2:       values.homeAddress2       || null,
    homeNeighborhood:   values.homeNeighborhood   || null,
    homeCity:           values.homeCity           || null,
    homeCounty:         values.homeCounty         || null,
    homeState:          values.homeState          || null,
    contactPhone:       values.contactPhone       || null,
    contactAltPhone:    values.contactAltPhone    || null,
    bloodType:          values.bloodType          || null,
    nextVaccinationDate: values.nextVaccinationDate || null,
    knownAllergies:     linesToPipe(values.knownAllergies),
    currentMedications: linesToPipe(values.currentMedications),
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>
}

function Label({ htmlFor, text, required }: { htmlFor: string; text: string; required?: boolean }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-foreground mb-1"
    >
      {text}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  )
}

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

const selectClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

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

export default function PatientFormPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const isEdit = !!id
  const clinicPatientID = id ?? ''

  // Load existing patient in edit mode
  const { data: existing, isLoading: loadingPatient } = usePatient(
    isEdit ? clinicPatientID : ''
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
    setError,
  } = useForm<PatientFormValues>({
    defaultValues: EMPTY_FORM,
  })

  // Populate form once patient data loads in edit mode
  useEffect(() => {
    if (isEdit && existing) {
      reset(patientToForm(existing))
    }
  }, [existing, isEdit, reset])

  // Mutations
  const createMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      navigate(`/patients/${patient.clinicPatientID}`)
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 409) {
        setError('clinicPatientID', { message: t('PATIENT_ID_IN_USE') })
      } else {
        setError('root', { message: t('ERROR_GENERIC') })
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Patient>) => updatePatient(clinicPatientID, data),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ['patients', clinicPatientID] })
      navigate(`/patients/${patient.clinicPatientID}`)
    },
    onError: () => {
      setError('root', { message: t('ERROR_GENERIC') })
    },
  })

  async function onSubmit(values: PatientFormValues) {
    const payload = formToPatient(values)
    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload as Parameters<typeof createPatient>[0])
    }
  }

  function handleReset() {
    if (isEdit && existing) {
      reset(patientToForm(existing))
    } else {
      reset(EMPTY_FORM)
    }
  }

  if (isEdit && loadingPatient) {
    return <p className="text-sm text-muted-foreground">{t('LOADING')}</p>
  }

  const isBusy = isSubmitting || createMutation.isPending || updateMutation.isPending
  const pageTitle = isEdit ? t('PATIENT_EDIT_TITLE') : t('PATIENT_NEW_TITLE')

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
        <Link
          to={isEdit ? `/patients/${clinicPatientID}` : '/patients'}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('PATIENT_CANCEL')}
        </Link>
      </div>

      {/* Root error */}
      {errors.root && (
        <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* ── Identity ── */}
        <SectionHeader title={t('PATIENT_DATA_HEAD', 'Patient data')} />

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
          {/* Clinic patient ID — only editable on create */}
          <FieldRow>
            <Label
              htmlFor="clinicPatientID"
              text={t('PATIENT_ADD_EDIT_ID_LABEL')}
              required={!isEdit}
            />
            <input
              id="clinicPatientID"
              type="text"
              placeholder={t('PATIENT_ID_PLACEHOLDER')}
              disabled={isEdit}
              className={inputClass}
              {...register('clinicPatientID', {
                validate: (v) =>
                  isEdit || !!v.trim() || t('ERROR_REQUIRED_FIELD'),
              })}
            />
            <FieldError message={errors.clinicPatientID?.message} />
          </FieldRow>

          <FieldRow>
            <Label htmlFor="familyID" text={t('PATIENT_FAMILY_ID_LABEL')} />
            <input
              id="familyID"
              type="text"
              placeholder={t('PATIENT_FAMILYID_PLACEHOLDER')}
              className={inputClass}
              {...register('familyID')}
            />
          </FieldRow>

          <FieldRow>
            <Label htmlFor="patientNationalID" text={t('PATIENT_NATIONAL_ID_LABEL')} />
            <input
              id="patientNationalID"
              type="text"
              className={inputClass}
              {...register('patientNationalID')}
            />
          </FieldRow>
        </div>

        {/* ── Name ── */}
        <SectionHeader title={t('PATIENT_NAME_LABEL')} />

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
          <FieldRow>
            <Label htmlFor="firstName" text={t('PATIENT_NAMEFIRST_PLACEHOLDER')} required />
            <input
              id="firstName"
              type="text"
              placeholder={t('PATIENT_NAMEFIRST_PLACEHOLDER')}
              className={inputClass}
              {...register('firstName', {
                validate: (v) => !!v.trim() || t('ERROR_REQUIRED_FIELD'),
              })}
            />
            <FieldError message={errors.firstName?.message} />
          </FieldRow>

          <FieldRow>
            <Label htmlFor="middleInitial" text={t('PATIENT_NAMEMI_PLACEHOLDER')} />
            <input
              id="middleInitial"
              type="text"
              maxLength={4}
              placeholder={t('PATIENT_NAMEMI_PLACEHOLDER')}
              className={inputClass}
              {...register('middleInitial')}
            />
          </FieldRow>

          <FieldRow>
            <Label htmlFor="lastName" text={t('PATIENT_NAMELAST_PLACEHOLDER')} required />
            <input
              id="lastName"
              type="text"
              placeholder={t('PATIENT_NAMELAST_PLACEHOLDER')}
              className={inputClass}
              {...register('lastName', {
                validate: (v) => !!v.trim() || t('ERROR_REQUIRED_FIELD'),
              })}
            />
            <FieldError message={errors.lastName?.message} />
          </FieldRow>

          <FieldRow>
            <Label htmlFor="lastName2" text={t('PATIENT_NAMELAST2_PLACEHOLDER')} />
            <input
              id="lastName2"
              type="text"
              placeholder={t('PATIENT_NAMELAST2_PLACEHOLDER')}
              className={inputClass}
              {...register('lastName2')}
            />
          </FieldRow>
        </div>

        {/* ── Personal ── */}
        <SectionHeader title={t('PATIENT_PERSONAL_LABEL', 'Personal info')} />

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
          <FieldRow>
            <Label htmlFor="sex" text={t('PATIENT_SEX_LABEL')} required />
            <select
              id="sex"
              className={selectClass}
              {...register('sex', {
                validate: (v) => !!v || t('ERROR_REQUIRED_FIELD'),
              })}
            >
              <option value="">{t('CHOOSE')}</option>
              {SEX_OPTIONS.filter(Boolean).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <FieldError message={errors.sex?.message} />
          </FieldRow>

          <FieldRow>
            <Label htmlFor="birthDate" text={t('PATIENT_BIRTHDATE_LABEL')} />
            <input
              id="birthDate"
              type="date"
              className={inputClass}
              {...register('birthDate')}
            />
          </FieldRow>

          <FieldRow>
            <Label htmlFor="maritalStatus" text={t('PATIENT_MARITAL_STATUS_LABEL')} />
            <select
              id="maritalStatus"
              className={selectClass}
              {...register('maritalStatus')}
            >
              {MARITAL_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o === '' ? t('CHOOSE') : t(`PATIENT_MARITAL_${o.toUpperCase()}`, o)}
                </option>
              ))}
            </select>
          </FieldRow>

          <FieldRow>
            <Label htmlFor="profession" text={t('PATIENT_PROFESSION_LABEL')} />
            <input
              id="profession"
              type="text"
              className={inputClass}
              {...register('profession')}
            />
          </FieldRow>

          <FieldRow>
            <Label htmlFor="preferredLanguage" text={t('PATIENT_PREFERRED_LANGUAGE_LABEL')} />
            <input
              id="preferredLanguage"
              type="text"
              className={inputClass}
              {...register('preferredLanguage')}
            />
          </FieldRow>

          <FieldRow>
            <Label htmlFor="organDonor" text={t('PATIENT_NEW_ORGAN_DONOR_LABEL')} />
            <select
              id="organDonor"
              className={selectClass}
              {...register('organDonor')}
            >
              <option value="">{t('NOT_SPECIFIED')}</option>
              <option value="1">{t('YES_OPTION', 'Yes')}</option>
              <option value="0">{t('NO_OPTION', 'No')}</option>
            </select>
          </FieldRow>

          <FieldRow>
            <Label htmlFor="responsibleParty" text={t('PATIENT_RESPONSIBLE_PARTY_LABEL')} />
            <input
              id="responsibleParty"
              type="text"
              className={inputClass}
              {...register('responsibleParty')}
            />
          </FieldRow>
        </div>

        {/* ── Medical ── */}
        <SectionHeader title={t('PATIENT_ALLERGIES_HEADING')} />

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
          <FieldRow>
            <Label htmlFor="bloodType" text={t('PATIENT_NEW_BLOODTYPE_LABEL')} />
            <select
              id="bloodType"
              className={selectClass}
              {...register('bloodType')}
            >
              {BLOOD_TYPE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o === '' ? t('NOT_SPECIFIED') : o}</option>
              ))}
            </select>
          </FieldRow>

          <FieldRow>
            <Label htmlFor="nextVaccinationDate" text={t('NEXT_VAX_DATE_INPUT_LABEL')} />
            <input
              id="nextVaccinationDate"
              type="date"
              className={inputClass}
              {...register('nextVaccinationDate')}
            />
          </FieldRow>
        </div>

        <FieldRow>
          <Label htmlFor="knownAllergies" text={t('PATIENT_KNOWN_ALLERGIES_LABEL')} />
          <textarea
            id="knownAllergies"
            rows={4}
            placeholder={t('PATIENT_KNOWN_ALLERGIES_PLACEHOLDER')}
            className={`${inputClass} resize-y`}
            {...register('knownAllergies')}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t('ALLERGY_ONE_PER_LINE', 'One entry per line')}
          </p>
        </FieldRow>

        <FieldRow>
          <Label htmlFor="currentMedications" text={t('PATIENT_CURRENT_MEDICATIONS_LABEL')} />
          <textarea
            id="currentMedications"
            rows={4}
            placeholder={t('PATIENT_CURRENT_MEDICATIONS_PLACEHOLDER')}
            className={`${inputClass} resize-y`}
            {...register('currentMedications')}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t('ALLERGY_ONE_PER_LINE', 'One entry per line')}
          </p>
        </FieldRow>

        {/* ── Contact ── */}
        <SectionHeader title={t('PATIENT_NEW_CONTACT_LABEL')} />

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
          <FieldRow>
            <Label htmlFor="contactPhone" text={t('PATIENT_NEW_CONTACT_PHONE_PLACEHOLDER')} />
            <input
              id="contactPhone"
              type="tel"
              className={inputClass}
              {...register('contactPhone')}
            />
          </FieldRow>

          <FieldRow>
            <Label htmlFor="contactAltPhone" text={t('PATIENT_NEW_CONTACT_ALT_PHONE_PLACEHOLDER')} />
            <input
              id="contactAltPhone"
              type="tel"
              className={inputClass}
              {...register('contactAltPhone')}
            />
          </FieldRow>
        </div>

        {/* ── Address ── */}
        <SectionHeader title={t('PATIENT_NEW_ADDRESS_LABEL')} />

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
          <FieldRow>
            <Label htmlFor="homeAddress1" text={t('PATIENT_NEW_HOMEADDRESS1_PLACEHOLDER')} />
            <input
              id="homeAddress1"
              type="text"
              className={inputClass}
              {...register('homeAddress1')}
            />
          </FieldRow>

          <FieldRow>
            <Label htmlFor="homeAddress2" text={t('PATIENT_NEW_HOMEADDRESS2_PLACEHOLDER')} />
            <input
              id="homeAddress2"
              type="text"
              className={inputClass}
              {...register('homeAddress2')}
            />
          </FieldRow>

          <FieldRow>
            <Label htmlFor="homeNeighborhood" text={t('HOME_NEIGHBORHOOD_LABEL')} />
            <input
              id="homeNeighborhood"
              type="text"
              className={inputClass}
              {...register('homeNeighborhood')}
            />
          </FieldRow>

          <FieldRow>
            <Label htmlFor="homeCity" text={t('PATIENT_NEW_CITY_PLACEHOLDER')} />
            <input
              id="homeCity"
              type="text"
              className={inputClass}
              {...register('homeCity')}
            />
          </FieldRow>

          <FieldRow>
            <Label htmlFor="homeCounty" text={t('PATIENT_NEW_COUNTY_PLACEHOLDER')} />
            <input
              id="homeCounty"
              type="text"
              className={inputClass}
              {...register('homeCounty')}
            />
          </FieldRow>

          <FieldRow>
            <Label htmlFor="homeState" text={t('PATIENT_NEW_STATE_PLACEHOLDER')} />
            <input
              id="homeState"
              type="text"
              className={inputClass}
              {...register('homeState')}
            />
          </FieldRow>
        </div>

        {/* ── Actions ── */}
        <div className="mt-8 flex items-center gap-3 border-t border-border pt-5">
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBusy
              ? t('LOADING')
              : isEdit
              ? t('PATIENT_SUBMIT_EDIT')
              : t('PATIENT_SUBMIT_NEW')}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={isBusy || !isDirty}
            className="rounded-md border border-border px-5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEdit ? t('ACTION_CANCEL') : t('PATIENT_RESET_FORM')}
          </button>

          <Link
            to={isEdit ? `/patients/${clinicPatientID}` : '/patients'}
            className="ml-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('PATIENT_CANCEL')}
          </Link>
        </div>

      </form>
    </div>
  )
}
