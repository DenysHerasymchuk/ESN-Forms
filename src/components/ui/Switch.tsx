type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}

export function Switch({ checked, onChange, label, disabled }: Props) {
  return (
    <label
      className={`flex items-center gap-2.5 text-sm font-medium text-ink ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
    >
      <span>{label}</span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          className="absolute inset-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-esn-blue peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-esn-blue"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
          aria-hidden="true"
        />
      </span>
    </label>
  )
}
