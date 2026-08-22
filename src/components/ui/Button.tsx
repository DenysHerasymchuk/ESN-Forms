import type { ButtonHTMLAttributes } from 'react'
import { secondaryButtonClassName, type ButtonTone } from './buttonStyles'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isSubmitting?: boolean
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esn-blue'

const primaryBase = `inline-flex items-center justify-center gap-2 rounded-lg py-3.5 text-base font-semibold transition duration-150 ${focusRing}`

export function PrimaryButton({ isSubmitting = false, disabled, className = '', children, ...props }: ButtonProps) {
  const isDisabled = disabled || isSubmitting
  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`${primaryBase} ${
        isDisabled
          ? 'cursor-not-allowed bg-slate-200 text-slate-400'
          : 'bg-esn-blue text-white hover:bg-esn-blue/90 active:scale-[0.97]'
      } ${isSubmitting ? 'cursor-progress' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export type { ButtonTone }

type SecondaryButtonProps = ButtonProps & {
  tone?: ButtonTone
}

export function SecondaryButton({ tone = 'blue', disabled, className = '', children, ...props }: SecondaryButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${secondaryButtonClassName(tone)} ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
