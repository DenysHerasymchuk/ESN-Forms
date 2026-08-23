const stripColors = ['bg-esn-pink', 'bg-esn-orange', 'bg-esn-green', 'bg-esn-blue']

function repeatedColors(times: number) {
  return Array.from({ length: times }, () => stripColors).flat()
}

function StripRow({ times, className }: { times: number; className: string }) {
  return (
    <div className={`w-full gap-1 bg-white ${className}`} aria-hidden="true">
      {repeatedColors(times).map((colorClass, index) => (
        <div key={index} className={`h-1.5 flex-1 ${colorClass}`} />
      ))}
    </div>
  )
}

// Same full-width strip, fewer repeats at narrower widths - at narrow
// widths each segment gets so thin the color pattern turns into visual
// noise instead of a clean brand stripe. Below `sm`: 1 pass, `sm` up to
// `lg`: 2 passes, `lg` and up: the original dense 4 passes.
export function BrandStrip() {
  return (
    <>
      <StripRow times={1} className="flex sm:hidden" />
      <StripRow times={2} className="hidden sm:flex lg:hidden" />
      <StripRow times={4} className="hidden lg:flex" />
    </>
  )
}
