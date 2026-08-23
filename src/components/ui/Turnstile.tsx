import { useEffect, useRef } from 'react'

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      remove: (widgetId: string) => void
    }
  }
}

let scriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Turnstile'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

type Props = {
  onVerify: (token: string) => void
  onExpire?: () => void
}

// Bot/spam protection on the public submission path. The widget itself only
// proves a real browser passed a challenge - submit-form independently
// re-verifies the resulting token server-side (against Cloudflare's own
// siteverify endpoint) before accepting anything, since a script could
// otherwise just skip rendering this and POST straight to the function.
export function Turnstile({ onVerify, onExpire }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!SITE_KEY) {
      console.error('Turnstile: VITE_TURNSTILE_SITE_KEY is not set')
      return
    }

    let cancelled = false

    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return
      // Stretches to the width of its container instead of Turnstile's
      // fixed 300x65 default, so it reads as part of the form's own
      // layout rather than an oddly-sized box dropped in on its own.
      // ('compact' avoids Cloudflare's own ~300px reflow floor but is a
      // tall, near-square box - not worth it just to save ~40px of width;
      // that width is reclaimed instead via the negative margin below.)
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: onVerify,
        'expired-callback': onExpire,
        theme: 'light',
        size: 'flexible',
      })
    })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
    // Rendered once per mount - the widget takes its callbacks at render
    // time rather than needing to be re-subscribed on every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // On a narrow phone, the card's own p-6 padding left just under 300px of
  // usable width - a hair below Cloudflare's flexible-mode reflow floor,
  // which was clipping the branding/privacy row instead of wrapping it.
  // Bleeding past that padding (below `sm`, where the card still uses p-6
  // rather than p-10) reclaims exactly that padding back for the widget.
  return <div ref={containerRef} className="-mx-6 mb-6 w-full sm:mx-0" />
}
