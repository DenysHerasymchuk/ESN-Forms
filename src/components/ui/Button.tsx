import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isSubmitting?: boolean
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esn-blue'

const primaryBase = `rounded-lg py-3 text-sm font-semibold transition-colors ${focusRing}`

export function PrimaryButton({ isSubmitting = false, disabled, className = '', children, ...props }: ButtonProps) {
  const isDisabled = disabled || isSubmitting
  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`${primaryBase} ${
        isDisabled ? 'cursor-not-allowed bg-slate-200 text-slate-400' : 'bg-esn-blue text-white hover:bg-esn-blue/90'
      } ${isSubmitting ? 'cursor-progress' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const secondaryBase = `rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-esn-blue transition-colors hover:bg-slate-50 ${focusRing}`

export function SecondaryButton({ disabled, className = '', children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${secondaryBase} ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
