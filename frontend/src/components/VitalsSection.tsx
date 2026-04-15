/**
 * VitalsSection.tsx
 *
 * Six-column vitals table used on all visit pages.
 * Matches v1 table.piClinicList with th.sixCol / td.sixCol columns.
 *
 * Two exports:
 *
 *   VitalsSection (default)
 *     Edit mode. Renders form inputs with react-hook-form.
 *     Used by VisitOpenPage, VisitEditPage, VisitClosePage.
 *
 *     <VitalsSection register={register} />
 *
 *   VitalsDisplaySection (named)
 *     Display mode. Renders plain text values. No form controls.
 *     Used by VisitDetailPage.
 *
 *     <VitalsDisplaySection values={{ height: 150, heightUnits: 'cm', ... }} />
 *
 * Plain CSS table (.data-table .vitals-table) for display layout.
 * Tailwind used only for form input styling (pre-existing pattern).
 */

import type { UseFormRegister, FieldValues, Path } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import './VitalsSection.css'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface VitalsFields {
  height:       string
  heightUnits:  string
  weight:       string
  weightUnits:  string
  temp:         string
  tempUnits:    string
  bpSystolic:   string
  bpDiastolic:  string
  pulse:        string
  glucose:      string
  glucoseUnits: string
}

export interface VitalsValues {
  height:       number | null
  heightUnits:  string | null
  weight:       number | null
  weightUnits:  string | null
  temp:         number | null
  tempUnits:    string | null
  bpSystolic:   number | null
  bpDiastolic:  number | null
  pulse:        number | null
  glucose:      number | null
  glucoseUnits: string | null
}

// ---------------------------------------------------------------------------
// Constants (edit mode)
// ---------------------------------------------------------------------------

const HEIGHT_UNITS  = ['cm', 'in']   as const
const WEIGHT_UNITS  = ['kg', 'lbs']  as const
const TEMP_UNITS    = ['C', 'F']     as const
const GLUCOSE_UNITS = ['RBS', 'FBS'] as const

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ' +
  'text-foreground placeholder:text-muted-foreground focus:outline-none ' +
  'focus:ring-2 focus:ring-ring disabled:opacity-50'

const unitSelectClass =
  'rounded-md border border-input bg-background px-2 py-2 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-ring'

// ---------------------------------------------------------------------------
// VitalsDisplaySection — plain text, no form controls
// ---------------------------------------------------------------------------

function formatVital(value: number | null, units: string | null): string {
  if (value == null) return '\u2014'
  return units ? `${value}\u00a0${units}` : String(value)
}

export function VitalsDisplaySection({ values }: { values: VitalsValues }) {
  const { t } = useTranslation()

  const bp = values.bpSystolic != null
    ? `${values.bpSystolic}/${values.bpDiastolic ?? '?'}`
    : '\u2014'

  const cols = [
    { label: t('VISIT_HEIGHT_LABEL'),  value: formatVital(values.height,  values.heightUnits) },
    { label: t('VISIT_WEIGHT_LABEL'),  value: formatVital(values.weight,  values.weightUnits) },
    { label: t('VISIT_TEMP_LABEL'),    value: formatVital(values.temp,    values.tempUnits) },
    { label: t('VISIT_BP_LABEL'),      value: bp },
    { label: t('VISIT_PULSE_LABEL'),   value: values.pulse != null ? String(values.pulse) : '\u2014' },
    { label: t('VISIT_GLUCOSE_LABEL'), value: formatVital(values.glucose, values.glucoseUnits) },
  ]

  return (
    <table className="data-table vitals-table">
      <thead>
        <tr>
          {cols.map((c) => <th key={c.label}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        <tr>
          {cols.map((c) => (
            <td key={c.label} className={c.value === '\u2014' ? 'dt-inactive' : undefined}>
              {c.value}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}

// ---------------------------------------------------------------------------
// VitalsSection (default) — edit mode with react-hook-form
// ---------------------------------------------------------------------------

interface VitalsSectionProps<T extends FieldValues> {
  register:  UseFormRegister<T>
  disabled?: boolean
}

export default function VitalsSection<T extends VitalsFields>({
  register,
  disabled = false,
}: VitalsSectionProps<T>) {
  const { t } = useTranslation()

  return (
    <div className="vitals-edit-grid">

      {/* Height */}
      <div className="vitals-field">
        <label className="vitals-label">{t('VISIT_HEIGHT_LABEL')}</label>
        <div className="vitals-input-row">
          <input type="number" step="0.1" min="0" placeholder="\u2014"
            disabled={disabled} className={`${inputClass} flex-1`}
            {...register('height' as Path<T>)} />
          <select disabled={disabled} className={unitSelectClass}
            {...register('heightUnits' as Path<T>)}>
            {HEIGHT_UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Weight */}
      <div className="vitals-field">
        <label className="vitals-label">{t('VISIT_WEIGHT_LABEL')}</label>
        <div className="vitals-input-row">
          <input type="number" step="0.1" min="0" placeholder="\u2014"
            disabled={disabled} className={`${inputClass} flex-1`}
            {...register('weight' as Path<T>)} />
          <select disabled={disabled} className={unitSelectClass}
            {...register('weightUnits' as Path<T>)}>
            {WEIGHT_UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Temp */}
      <div className="vitals-field">
        <label className="vitals-label">{t('VISIT_TEMP_LABEL')}</label>
        <div className="vitals-input-row">
          <input type="number" step="0.1" min="0" placeholder="\u2014"
            disabled={disabled} className={`${inputClass} flex-1`}
            {...register('temp' as Path<T>)} />
          <select disabled={disabled} className={unitSelectClass}
            {...register('tempUnits' as Path<T>)}>
            {TEMP_UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* BP */}
      <div className="vitals-field">
        <label className="vitals-label">{t('VISIT_BP_LABEL')}</label>
        <div className="vitals-input-row">
          <input type="number" min="0"
            placeholder={t('BP_SYS_PLACEHOLDER')}
            disabled={disabled} className={`${inputClass} flex-1`}
            {...register('bpSystolic' as Path<T>)} />
          <span className="vitals-bp-sep">/</span>
          <input type="number" min="0"
            placeholder={t('BP_DIA_PLACEHOLDER')}
            disabled={disabled} className={`${inputClass} flex-1`}
            {...register('bpDiastolic' as Path<T>)} />
        </div>
      </div>

      {/* Pulse */}
      <div className="vitals-field">
        <label className="vitals-label">{t('VISIT_PULSE_LABEL')}</label>
        <input type="number" min="0" placeholder="\u2014"
          disabled={disabled} className={inputClass}
          {...register('pulse' as Path<T>)} />
      </div>

      {/* Glucose */}
      <div className="vitals-field">
        <label className="vitals-label">{t('VISIT_GLUCOSE_LABEL')}</label>
        <div className="vitals-input-row">
          <input type="number" min="0" placeholder="\u2014"
            disabled={disabled} className={`${inputClass} flex-1`}
            {...register('glucose' as Path<T>)} />
          <select disabled={disabled} className={unitSelectClass}
            {...register('glucoseUnits' as Path<T>)}>
            {GLUCOSE_UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>

    </div>
  )
}
