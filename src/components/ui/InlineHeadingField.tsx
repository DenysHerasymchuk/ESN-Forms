import { useEffect, useRef } from 'react'

type InlineHeadingFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
  rows?: number
}

const headingClasses =
  'w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 font-display text-3xl font-semibold text-ink placeholder:text-slate-300 transition-colors focus:border-esn-blue focus:outline-none focus:ring-0'
const descriptionClasses =
  'mt-3 w-full resize-none overflow-hidden border-0 border-b border-slate-200 bg-transparent px-0 py-2 text-base text-ink placeholder:text-slate-400 transition-colors focus:border-esn-blue focus:outline-none focus:ring-0'

// A borderless, underline-on-focus, inline-editable heading - used for the
// form builder's title/description, where wrapping them in TextField's
// bordered box would fight the "this IS the page heading" intent.
export function InlineHeadingField({ value, onChange, placeholder, multiline = false, rows = 1 }: InlineHeadingFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // A fixed row count leaves the underline sitting under empty space
  // whenever the text is shorter than that - grow to fit the actual
  // content instead, so the underline always hugs the last line typed.
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value])

  if (multiline) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={descriptionClasses}
      />
    )
  }

  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={headingClasses}
    />
  )
}
