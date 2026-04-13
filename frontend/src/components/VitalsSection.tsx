/**
 * VitalsSection.tsx
 *
 * Shared vitals form fields used by VisitOpenPage, VisitEditPage,
 * and VisitClosePage. Accepts react-hook-form's register function
 * as a prop so it integrates cleanly into any form context.
 *
 * Fields: height, weight, temp, BP (systolic/diastolic), pulse, glucose.
 * Each measurement has a companion units selector.
 */

import type { UseFormRegister, FieldValues, Path } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

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

// The form values type must include these field names.
// Using a generic so VitalsSection works with any form that has these fields.
export interface VitalsFields {
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
}

interface Props<T extends FieldValues> {
  register: UseFormRegister<T>
  disabled?: boolean
}

export default function VitalsSection<T extends VitalsFields>({
  register,
  disabled = false,
}: Props<T>) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

      {/* Height */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          {t('VISIT_HEIGHT_LABEL')}
        </label>
        <div className="flex gap-1">
          <input
            type="number" step="0.1" min="0" placeholder="—"
            disabled={disabled}
            className={`${inputClass} flex-1`}
            {...register('height' as Path<T>)}
          />
          <select disabled={disabled} className={unitSelectClass}
            {...register('heightUnits' as Path<T>)}>
            {HEIGHT_UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Weight */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          {t('VISIT_WEIGHT_LABEL')}
        </label>
        <div className="flex gap-1">
          <input
            type="number" step="0.1" min="0" placeholder="—"
            disabled={disabled}
            className={`${inputClass} flex-1`}
            {...register('weight' as Path<T>)}
          />
          <select disabled={disabled} className={unitSelectClass}
            {...register('weightUnits' as Path<T>)}>
            {WEIGHT_UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Temp */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          {t('VISIT_TEMP_LABEL')}
        </label>
        <div className="flex gap-1">
          <input
            type="number" step="0.1" min="0" placeholder="—"
            disabled={disabled}
            className={`${inputClass} flex-1`}
            {...register('temp' as Path<T>)}
          />
          <select disabled={disabled} className={unitSelectClass}
            {...register('tempUnits' as Path<T>)}>
            {TEMP_UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* BP */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          {t('VISIT_BP_LABEL')}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number" min="0"
            placeholder={t('BP_SYS_PLACEHOLDER', 'Sys')}
            disabled={disabled}
            className={`${inputClass} flex-1`}
            {...register('bpSystolic' as Path<T>)}
          />
          <span className="text-muted-foreground text-sm">/</span>
          <input
            type="number" min="0"
            placeholder={t('BP_DIA_PLACEHOLDER', 'Dia')}
            disabled={disabled}
            className={`${inputClass} flex-1`}
            {...register('bpDiastolic' as Path<T>)}
          />
        </div>
      </div>

      {/* Pulse */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          {t('VISIT_PULSE_LABEL')}
        </label>
        <input
          type="number" min="0" placeholder="—"
          disabled={disabled}
          className={inputClass}
          {...register('pulse' as Path<T>)}
        />
      </div>

      {/* Glucose */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          {t('VISIT_GLUCOSE_LABEL')}
        </label>
        <div className="flex gap-1">
          <input
            type="number" min="0" placeholder="—"
            disabled={disabled}
            className={`${inputClass} flex-1`}
            {...register('glucose' as Path<T>)}
          />
          <select disabled={disabled} className={unitSelectClass}
            {...register('glucoseUnits' as Path<T>)}>
            {GLUCOSE_UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>

    </div>
  )
}
