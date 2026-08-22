import ReactMarkdown, { type Components } from 'react-markdown'

// react-markdown never renders raw HTML from the source by default, so this
// is safe against injected markup - no sanitizer plugin needed.
const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-esn-blue hover:underline">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  code: ({ children }) => <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">{children}</code>,
}

type Props = {
  children: string
}

export function Markdown({ children }: Props) {
  return (
    <div className="text-sm text-muted">
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  )
}
