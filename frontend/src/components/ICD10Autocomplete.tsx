/**
 * ICD10Autocomplete.tsx
 *
 * Debounced ICD-10 code search with dropdown results.
 * Used three times on the visit open/edit form (diagnosis 1, 2, 3).
 *
 * Props:
 *   value       — currently selected code string (for display)
 *   onSelect    — called with (icd10code, shortDescription) on selection
 *   language    — 'en' | 'es', mirrors the active i18n language
 *   placeholder — input placeholder text
 *   disabled    — disables the input
 *
 * Pi note: description search ~195ms. Debounce is 350ms to avoid
 * stale results racing on the Pi's slower CPU.
 * AbortController cancels in-flight requests on each new keystroke.
 */

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { searchIcdCodes, type IcdCode } from '@/api/icd'

interface Props {
  value:       string
  onSelect:    (code: string, description: string) => void
  language?:   'en' | 'es'
  placeholder?: string
  disabled?:   boolean
}

export default function ICD10Autocomplete({
  value,
  onSelect,
  language = 'en',
  placeholder,
  disabled = false,
}: Props) {
  const { t } = useTranslation()

  const [inputValue, setInputValue]   = useState(value)
  const [results, setResults]         = useState<IcdCode[]>([])
  const [isOpen, setIsOpen]           = useState(false)
  const [isLoading, setIsLoading]     = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef     = useRef<AbortController | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep input in sync when external value changes (e.g. form reset)
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value
    setInputValue(query)
    setActiveIndex(-1)

    // Cancel previous debounce and in-flight request
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortRef.current) abortRef.current.abort()

    if (!query.trim() || query.length < 2) {
      setResults([])
      setIsOpen(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const codes = await searchIcdCodes({ q: query, language, sort: 'd' })
        if (!controller.signal.aborted) {
          setResults(codes.slice(0, 10))
          setIsOpen(codes.length > 0)
          setIsLoading(false)
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults([])
          setIsOpen(false)
          setIsLoading(false)
        }
      }
    }, 350)
  }

  function handleSelect(code: IcdCode) {
    const description = code.shortDescription ?? ''
    setInputValue(code.icd10code)
    setResults([])
    setIsOpen(false)
    setActiveIndex(-1)
    onSelect(code.icd10code, description)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0) handleSelect(results[activeIndex])
        break
      case 'Escape':
        setIsOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  const inputClass =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ' +
    'text-foreground placeholder:text-muted-foreground focus:outline-none ' +
    'focus:ring-2 focus:ring-ring disabled:opacity-50'

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder ?? t('ICD_SEARCH_PLACEHOLDER')}
          disabled={disabled}
          autoComplete="off"
          className={inputClass}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-haspopup="listbox"
        />
        {isLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {t('ICD_LOADING')}
          </span>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-border shadow-lg"
          style={{ backgroundColor: '#fff' }}
        >
          {results.map((code, index) => (
            <li
              key={code.icd10code}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={() => handleSelect(code)}
              onMouseEnter={() => setActiveIndex(index)}
              className={[
                'flex items-baseline gap-3 px-3 py-2 text-sm cursor-pointer',
                index === activeIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted',
              ].join(' ')}
            >
              <span className="font-mono text-xs flex-shrink-0 w-20 pr-2 border-r border-border">
                {code.icd10code}
              </span>
              <span className="truncate pl-1">
                {code.shortDescription ?? code.icd10code}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
