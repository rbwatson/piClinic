/**
 * DiagnosisField.tsx
 *
 * Single diagnosis slot rendered three times per visit form.
 * Matches v1: label + condition select (New/Subsequent) + ICD-10 autocomplete.
 *
 * Deliberately decoupled from react-hook-form — the parent page passes
 * callbacks that call setValue(), keeping this component independently
 * testable.
 *
 * Usage:
 *   <DiagnosisField
 *     n={1}
 *     language="en"
 *     conditionValue={watch('condition1')}
 *     icdValue={watch('condition1') ?? ''}
 *     onConditionChange={(val) => setValue('condition1', val)}
 *     onIcdSelect={(code, desc) => {
 *       setValue('condition1', code)
 *       setValue('diagnosis1', desc)
 *     }}
 *   />
 */

import { useTranslation } from 'react-i18next'
import ICD10Autocomplete from './ICD10Autocomplete'
import './DiagnosisField.css'

interface DiagnosisFieldProps {
  n:                  1 | 2 | 3
  language:           'en' | 'es'
  conditionValue:     string
  icdValue:           string
  onConditionChange:  (value: string) => void
  onIcdSelect:        (code: string, description: string) => void
  disabled?:          boolean
}

export default function DiagnosisField({
  n,
  language,
  conditionValue,
  icdValue,
  onConditionChange,
  onIcdSelect,
  disabled = false,
}: DiagnosisFieldProps) {
  const { t } = useTranslation()

  return (
    <div className="diagnosis-field">
      <label className="diagnosis-field-label">
        {t(`VISIT_DIAGNOSIS_${n}_LABEL`)}
      </label>

      <select
        className="diagnosis-condition-select"
        value={conditionValue}
        onChange={(e) => onConditionChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{t('VISIT_TYPE_PLACEHOLDER')}</option>
        <option value="NEWDIAG">{t('ICD_CONDITION_NEW')}</option>
        <option value="SUBSDIAG">{t('ICD_CONDITION_SUBSEQUENT')}</option>
      </select>

      <div className="diagnosis-icd-wrap">
        <ICD10Autocomplete
          value={icdValue}
          language={language}
          placeholder={t('ICD_SEARCH_PLACEHOLDER')}
          onSelect={onIcdSelect}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
