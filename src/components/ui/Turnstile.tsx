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
      // 'flexible' stretches to the container's width, which is what makes
      // it read as part of the form's own layout instead of an oddly-sized
      // box - but Cloudflare's own layout for it doesn't actually reflow
      // below roughly 300px, so on a narrow phone the branding/privacy
      // row inside the widget gets clipped instead of wrapping. 'compact'
      // is the mode Cloudflare built for exactly that width, so use it
      // once the available space drops below that.
      const width = containerRef.current.getBoundingClientRect().width
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: onVerify,
        'expired-callback': onExpire,
        theme: 'light',
        size: width < 300 ? 'compact' : 'flexible',
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

  return <div ref={containerRef} className="mb-6 flex w-full justify-center" />
}
