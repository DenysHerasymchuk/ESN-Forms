import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isSubmitting?: boolean
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esn-blue'

const primaryBase = `inline-flex items-center justify-center gap-2 rounded-lg py-3.5 text-base font-semibold transition-colors ${focusRing}`

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

export type ButtonTone = 'blue' | 'orange' | 'pink' | 'green'

const secondaryBase = `inline-flex items-center justify-center gap-2 rounded-md border px-3.5 py-2 text-sm font-medium transition-colors ${focusRing}`

const secondaryToneClasses: Record<ButtonTone, string> = {
  blue: 'border-esn-blue/30 text-esn-blue hover:bg-esn-blue/10',
  orange: 'border-esn-orange/30 text-esn-orange hover:bg-esn-orange/10',
  pink: 'border-esn-pink/30 text-esn-pink hover:bg-esn-pink/10',
  green: 'border-esn-green/30 text-esn-green hover:bg-esn-green/10',
}

type SecondaryButtonProps = ButtonProps & {
  tone?: ButtonTone
}

export function SecondaryButton({ tone = 'blue', disabled, className = '', children, ...props }: SecondaryButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${secondaryBase} ${secondaryToneClasses[tone]} ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
