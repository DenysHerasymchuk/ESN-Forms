import type { ReactNode } from 'react'
import { BrandStrip } from '../BrandStrip'
import { Footer } from '../Footer'

type Props = {
  children: ReactNode
}

export function CenteredCardShell({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <BrandStrip />

      <div className="flex flex-1 flex-col items-center px-4 pt-8 pb-12 sm:px-6 sm:pt-12">
        <div className="mx-auto w-full max-w-2xl">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-6 sm:p-10">{children}</div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
