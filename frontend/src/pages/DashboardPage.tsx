/**
 * DashboardPage.tsx
 *
 * Clinic dashboard: open visits table + patient search bar.
 * Matches v1 clinicDash.php.
 *
 * Data: GET /api/v2/visits?visitStatus=Open -> Visit[] (bare array)
 * Refreshes every 60 seconds via useOpenVisits() hook.
 *
 * Columns: Name | Patient ID | Arrived | Doctor | Visit type | Complaint
 * Actions: View, Edit, Discharge (linking to Group 3/6 pages, wired later)
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useOpenVisits, type Visit } from '@/api/visits'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(dateTimeStr: string | null): string {
  if (!dateTimeStr) return '—'
  const d = new Date(dateTimeStr)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function patientFullName(visit: Visit): string {
  return `${visit.patientFirstName} ${visit.patientLastName}`.trim()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')

  const { data: visits, isLoading, isError, error } = useOpenVisits()

  // Client-side filter on the already-loaded open visits
  const filtered = visits?.filter((v) => {
    if (!searchValue.trim()) return true
    const q = searchValue.toLowerCase()
    return (
      v.patientFirstName.toLowerCase().includes(q) ||
      v.patientLastName.toLowerCase().includes(q) ||
      v.clinicPatientID.toLowerCase().includes(q)
    )
  }) ?? []

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (searchValue.trim()) {
      navigate(`/patients?q=${encodeURIComponent(searchValue.trim())}`)
    }
  }

  return (
    <div>
      {/* Page title + search bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-xl font-semibold text-foreground">
          {t('DASHBOARD_OPEN_VISITS')}
        </h1>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={t('DASHBOARD_SEARCH_PLACEHOLDER')}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-64"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {t('ACTION_SEARCH')}
          </button>
        </form>
      </div>

      {/* States */}
      {isLoading && (
        <p className="text-sm text-muted-foreground">{t('LOADING')}</p>
      )}

      {isError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {t('ERROR_GENERIC')}
          {import.meta.env.DEV && (
            <span className="ml-2 opacity-60">
              {(error as Error)?.message}
            </span>
          )}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {visits?.length === 0
            ? t('DASHBOARD_NO_OPEN_VISITS')
            : t('PATIENT_SEARCH_NOT_FOUND')}
        </p>
      )}

      {/* Open visits table */}
      {!isLoading && !isError && filtered.length > 0 && (
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
                  {t('VISIT_ARRIVED_LABEL')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('VISIT_ASSIGNED_LABEL')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t('VISIT_COMPLAINT_PRIMARY_LABEL')}
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  {t('VISIT_LIST_ACTIONS', 'Actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((visit) => (
                <tr
                  key={visit.patientVisitID}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link
                      to={`/patients/${visit.clinicPatientID}`}
                      className="hover:text-primary transition-colors"
                    >
                      {patientFullName(visit)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {visit.clinicPatientID}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatTime(visit.dateTimeIn)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {visit.staffName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                    {visit.primaryComplaint ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/visits/${visit.patientVisitID}`}
                        className="text-xs text-primary hover:underline"
                      >
                        {t('VISIT_LIST_ACTION_VIEW')}
                      </Link>
                      <Link
                        to={`/visits/${visit.patientVisitID}/edit`}
                        className="text-xs text-primary hover:underline"
                      >
                        {t('VISIT_LIST_ACTION_EDIT')}
                      </Link>
                      <Link
                        to={`/visits/${visit.patientVisitID}/close`}
                        className="text-xs text-destructive hover:underline"
                      >
                        {t('VISIT_LIST_ACTION_DISCHARGE')}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Row count */}
      {!isLoading && visits && visits.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {filtered.length} of {visits.length} {t('DASHBOARD_OPEN_VISITS').toLowerCase()}
        </p>
      )}
    </div>
  )
}
