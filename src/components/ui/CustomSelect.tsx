import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { FaCheck, FaChevronDown } from 'react-icons/fa6'

export type SelectOption = { value: string; label: string; icon?: ReactNode }

type Props = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  ariaLabel: string
}

type Placement = { top: number; left: number; width: number; openUpward: boolean }

// A custom-styled dropdown (button + floating panel) for contexts where the
// native <select> would look out of place next to the rest of a hand-styled
// UI. The panel is portaled to document.body and positioned from the
// trigger's own bounding rect (not a CSS-relative parent) - question cards
// use `overflow-hidden` for their remove animation, which was silently
// clipping the panel whenever it extended past the card's edge, cutting
// off the lower options with no way to reach them. Closing on an
// outside pointerdown (instead of a full-viewport backdrop button) avoids
// that backdrop intercepting scroll/click on the rest of the page while
// the panel is open.
export function CustomSelect({ value, onChange, options, ariaLabel }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [placement, setPlacement] = useState<Placement | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLUListElement>(null)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!isOpen) return

    function updatePlacement() {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const openUpward = spaceBelow < 260 && rect.top > spaceBelow
      setPlacement({
        top: openUpward ? rect.top : rect.bottom,
        left: rect.left,
        width: rect.width,
        openUpward,
      })
    }
    updatePlacement()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setIsOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('resize', updatePlacement)
    window.addEventListener('scroll', updatePlacement, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('resize', updatePlacement)
      window.removeEventListener('scroll', updatePlacement, true)
    }
  }, [isOpen])

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-esn-blue focus:border-esn-blue focus:outline-none focus:ring-2 focus:ring-esn-blue/30"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon}
          <span className="truncate">{selected?.label ?? 'Select…'}</span>
        </span>
        <FaChevronDown
          aria-hidden="true"
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen &&
        placement &&
        createPortal(
          <ul
            ref={panelRef}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: 'fixed',
              left: placement.left,
              width: placement.width,
              ...(placement.openUpward
                ? { bottom: window.innerHeight - placement.top + 8 }
                : { top: placement.top + 8 }),
            }}
            className="animate-fade-in-down z-20 max-h-64 min-w-max overflow-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg"
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
                  <span className="flex min-w-0 items-center gap-2">
                    {option.icon}
                    <span className="truncate">{option.label}</span>
                  </span>
                  {option.value === value && <FaCheck aria-hidden="true" className="shrink-0" />}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  )
}
