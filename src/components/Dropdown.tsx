import { useState, useRef, useEffect } from 'react'

export interface DropdownOption {
  value: string
  label: string
}

export interface DropdownProps {
  id?: string
  value: string
  onChange: (value: string) => void
  options: readonly string[] | DropdownOption[]
  placeholder?: string
  className?: string
  'aria-label'?: string
}

function normalizeOptions(
  options: readonly string[] | DropdownOption[]
): DropdownOption[] {
  return options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )
}

export default function Dropdown({
  id,
  value,
  onChange,
  options,
  placeholder = '—',
  className = '',
  'aria-label': ariaLabel,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const opts = normalizeOptions(options)
  const selectedOption = opts.find((o) => o.value === value)
  const displayLabel = selectedOption ? selectedOption.label : placeholder

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const allOptions = [{ value: '', label: placeholder }, ...opts]

  useEffect(() => {
    if (!open) {
      setFocusedIndex(-1)
      return
    }
    const idx = value === '' ? 0 : opts.findIndex((o) => o.value === value) + 1
    setFocusedIndex(idx >= 0 ? idx : 0)
  }, [open, value, options])

  useEffect(() => {
    if (!open || focusedIndex < 0) return
    const el = listRef.current?.children[focusedIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, focusedIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((i) => (i < allOptions.length - 1 ? i + 1 : i))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((i) => (i > 0 ? i - 1 : 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && allOptions[focusedIndex]) {
          onChange(allOptions[focusedIndex].value)
          setOpen(false)
        }
        break
      default:
        break
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800 shadow-sm transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none hover:border-slate-300 flex items-center justify-between gap-2"
      >
        <span className={selectedOption ? '' : 'text-slate-400'}>
          {displayLabel}
        </span>
        <svg
          className={`h-4 w-4 flex-shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-labelledby={id}
          className="dropdown-list absolute left-0 right-0 top-full z-10 mt-1 max-h-52 overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {allOptions.map((opt, i) => (
            <li key={opt.value || '__placeholder__'} role="option" aria-selected={value === opt.value}>
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm focus:outline-none transition-[background-color,color] duration-150 ease-out ${
                  value === opt.value
                    ? opt.value === ''
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-sky-400 text-white'
                    : i === focusedIndex
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-slate-700 hover:bg-blue-100 hover:text-blue-800 focus:bg-blue-100 focus:text-blue-800'
                }`}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                onMouseEnter={() => setFocusedIndex(i)}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
