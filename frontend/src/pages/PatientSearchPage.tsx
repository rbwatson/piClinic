/**
 * PatientSearchPage.tsx
 *
 * Patient search screen. Matches v1 ptResults.php.
 *
 * Search supports:
 *   - Free-text (q) via the URL query param from the dashboard search bar
 *   - Individual name fields: firstName, lastName, lastName2, middleInitial
 *   - ID fields: clinicPatientID, patientNationalID, familyID
 *
 * The form initialises from URL search params so the dashboard search bar
 * navigates directly here with results already loaded.
 *
 * Results link to /patients/:id (PatientDetailPage, Group 3).
 * "Add new patient" links to /patients/new (PatientFormPage, Group 4).
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePatientSearch, patientDisplayName, type PatientSearchParams } from '@/api/patients'

const EMPTY: PatientSearchParams = {
  q: '',
  firstName: '',
  lastName: '',
  lastName2: '',
  clinicPatientID: '',
  patientNationalID: '',
}

export default function PatientSearchPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Initialise form from URL params (e.g. ?q=smith from dashboard)
  const [form, setForm] = useState<PatientSearchParams>({
    ...EMPTY,
    q: searchParams.get('q') ?? '',
  })

  // The query we actually fire — only updated on submit
  const [submitted, setSubmitted] = useState<PatientSearchParams>(
    form.q ? { q: form.q } : EMPTY
  )

  const { data: patients, isLoading, isError } = usePatientSearch(submitted)

  // If the URL carries a ?q= param on mount, fire immediately
  useEffect(() => {
    if (searchParams.get('q')) {
      setSubmitted({ q: searchParams.get('q')! })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleChange(field: keyof PatientSearchParams, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Strip empty fields before submitting
    const params: PatientSearchParams = {}
    for (const [k, v] of Object.entries(form)) {
      if (v && v.trim()) params[k as keyof PatientSearchParams] = v.trim()
    }
    setSubmitted(params)
  }

  function handleReset() {
    setForm(EMPTY)
    setSubmitted(EMPTY)
    navigate('/patients', { replace: true })
  }

  const hasResults = patients !== undefined
  const hasParams  = Object.values(submitted).some((v) => v && v.trim())

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">
          {t('PATIENT_SEARCH_HEADING')}
        </h1>
        <Link
          to="/patients/new"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {t('PATIENT_ADD_NEW')}
        </Link>
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-lg p-5 mb-6"
      >
        {/* Free-text row */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('PATIENT_SEARCH_ID_LABEL')}
          </label>
          <input
            type="search"
            value={form.q ?? ''}
            onChange={(e) => handleChange('q', e.target.value)}
            placeholder={t('PATIENT_SEARCH_ID_LABEL')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('PATIENT_SEARCH_NAMEFIRST_PLACEHOLDER')}
            </label>
            <input
              type="text"
              value={form.firstName ?? ''}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder={t('PATIENT_SEARCH_NAMEFIRST_PLACEHOLDER')}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('PATIENT_SEARCH_NAMEMI_PLACEHOLDER')}
            </label>
            <input
              type="text"
              value={form.middleInitial ?? ''}
              onChange={(e) => handleChange('middleInitial', e.target.value)}
              placeholder={t('PATIENT_SEARCH_NAMEMI_PLACEHOLDER')}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('PATIENT_SEARCH_NAMELAST_PLACEHOLDER')}
            </label>
            <input
              type="text"
              value={form.lastName ?? ''}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder={t('PATIENT_SEARCH_NAMELAST_PLACEHOLDER')}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('PATIENT_SEARCH_NAMELAST2_PLACEHOLDER')}
            </label>
            <input
              type="text"
              value={form.lastName2 ?? ''}
              onChange={(e) => handleChange('lastName2', e.target.value)}
              placeholder={t('PATIENT_SEARCH_NAMELAST2_PLACEHOLDER')}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {t('PATIENT_SEARCH_SUBMIT')}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('PATIENT_RESET_SEARCH')}
          </button>
        </div>
      </form>

      {/* Results */}
      {isLoading && (
        <p className="text-sm text-muted-foreground">{t('LOADING')}</p>
      )}

      {isError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {t('ERROR_GENERIC')}
        </div>
      )}

      {hasResults && hasParams && patients!.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t('PATIENT_SEARCH_NOT_FOUND')}
        </p>
      )}

      {hasResults && patients!.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            {t('PATIENT_SEARCH_FOUND')}
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t('PATIENT_NAME_LABEL')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t('PATIENT_ID_LABEL')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t('PATIENT_SEX_LABEL')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t('PATIENT_BIRTHDATE_LABEL')}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {t('PATIENT_FAMILY_ID_LABEL')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {patients!.map((p) => (
                  <tr
                    key={p.clinicPatientID}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/patients/${p.clinicPatientID}`)}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link
                        to={`/patients/${p.clinicPatientID}`}
                        className="hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {patientDisplayName(p)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {p.clinicPatientID}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.sex}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.birthDate ?? t('NOT_SPECIFIED')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {p.familyID ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {patients!.length} {t('PATIENT_SEARCH_RESULTS_HEADING').toLowerCase()}
          </p>
        </>
      )}
    </div>
  )
}
