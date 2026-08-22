import { useEffect, useState } from 'react'
import { FaCheck, FaChevronDown } from 'react-icons/fa6'

export type SelectOption = { value: string; label: string }

type Props = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  ariaLabel: string
}

// A custom-styled dropdown (button + floating panel) for contexts where the
// native <select> would look out of place next to the rest of a hand-styled
// UI - reuses the same open/close/backdrop pattern as the nav menu.
export function CustomSelect({ value, onChange, options, ariaLabel }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-esn-blue focus:border-esn-blue focus:outline-none focus:ring-2 focus:ring-esn-blue/30"
      >
        <span>{selected?.label ?? 'Select…'}</span>
        <FaChevronDown
          aria-hidden="true"
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <ul
            role="listbox"
            aria-label={ariaLabel}
            className="animate-fade-in-down absolute top-full left-0 z-20 mt-2 max-h-64 w-full min-w-max overflow-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg"
          >
            {options.map((option) => (
              <li key={option.value} role="option" aria-selected={option.value === value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-esn-blue/5 ${
                    option.value === value ? 'font-medium text-esn-blue' : 'text-ink'
                  }`}
                >
                  {option.label}
                  {option.value === value && <FaCheck aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
