const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-esn-blue'

export type ButtonTone = 'blue' | 'orange' | 'pink' | 'green' | 'error'

const secondaryBase = `inline-flex items-center justify-center gap-2 rounded-md border px-3.5 py-2 text-sm font-medium transition duration-150 active:scale-[0.97] ${focusRing}`

const secondaryToneClasses: Record<ButtonTone, string> = {
  blue: 'border-esn-blue/30 text-esn-blue hover:bg-esn-blue/10',
  orange: 'border-esn-orange/30 text-esn-orange hover:bg-esn-orange/10',
  pink: 'border-esn-pink/30 text-esn-pink hover:bg-esn-pink/10',
  green: 'border-esn-green/30 text-esn-green hover:bg-esn-green/10',
  // Reserved for irreversible destructive actions (form deletion) - kept
  // distinct from `pink` (Archive), which is reversible.
  error: 'border-error/30 text-error hover:bg-error/10',
}

// Lets a plain <a>/<Link> match SecondaryButton's exact look without
// duplicating its class strings (e.g. NotFoundPage's "back home" link).
export function secondaryButtonClassName(tone: ButtonTone = 'blue', className = ''): string {
  return `${secondaryBase} ${secondaryToneClasses[tone]} ${className}`
}
