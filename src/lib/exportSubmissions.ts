import type { FormRow, SubmissionRow } from './database.types'
import { formatAnswer, type Field } from './formField'

// xlsx's known advisories (prototype pollution, ReDoS) are both in its
// *parsing* path (read/readFile on untrusted input) - this module only ever
// writes a file built from our own trusted Supabase data via
// aoa_to_sheet/book_new/writeFile, so they don't apply here. Worth
// rechecking this assumption before ever adding an "import spreadsheet"
// feature that reuses this dependency to read a user-supplied file.

function exportableFields(form: FormRow): Field[] {
  return form.fields.filter((field) => !field.deprecated)
}

function submissionRow(fields: Field[], submission: SubmissionRow): string[] {
  return [...fields.map((field) => formatAnswer(field, submission.answers)), new Date(submission.submitted_at).toLocaleString()]
}

function exportFileName(form: FormRow, label: string, extension: string): string {
  const date = new Date().toISOString().slice(0, 10)
  return `${form.slug}-${label}-${date}.${extension}`
}

export async function exportSubmissionsToExcel(form: FormRow, submissions: SubmissionRow[]): Promise<void> {
  const XLSX = await import('xlsx')
  const fields = exportableFields(form)
  const headers = [...fields.map((field) => field.label || 'Untitled question'), 'Submitted at']
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...submissions.map((submission) => submissionRow(fields, submission))])
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Submissions')
  XLSX.writeFile(book, exportFileName(form, 'submissions', 'xlsx'))
}

const ESN_BLUE: [number, number, number] = [37, 99, 235]
const ESN_ORANGE: [number, number, number] = [249, 115, 22]
const ESN_MUTED: [number, number, number] = [110, 120, 140]

// Best-effort - a failed logo fetch (offline, blocked request) shouldn't
// break the export, it should just fall back to a text-only header.
async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch('/pictures/Logo_ESN.png')
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

type PdfKind = 'submissions' | 'attendance'

// Shared by both PDF variants - "attendance" just appends a blank
// Signature column (grid-bordered, extra tall) meant to be printed and
// signed by hand; everything else about the layout is identical.
async function buildPdf(form: FormRow, submissions: SubmissionRow[], kind: PdfKind) {
  const { jsPDF } = await import('jspdf')
  const { autoTable } = await import('jspdf-autotable')
  const fields = exportableFields(form)
  const logo = await loadLogoDataUrl()
  const doc = new jsPDF({ orientation: 'portrait', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const title = kind === 'attendance' ? `${form.name} — Attendance sheet` : form.name

  doc.setProperties({ title: exportFileName(form, kind, 'pdf') })

  if (logo) {
    doc.addImage(logo, 'PNG', 14, 8, 20, 10)
  }
  doc.setTextColor(...ESN_BLUE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, logo ? 40 : 14, 16)
  doc.setDrawColor(...ESN_ORANGE)
  doc.setLineWidth(0.8)
  doc.line(14, 22, pageWidth - 14, 22)

  const head = ['#', ...fields.map((field) => field.label || 'Untitled question'), 'Submitted at']
  const body = submissions.map((submission, index) => [String(index + 1), ...submissionRow(fields, submission)])
  if (kind === 'attendance') {
    head.push('Signature')
    for (const row of body) row.push('')
  }
  const signatureColumnIndex = head.length - 1

  autoTable(doc, {
    startY: 28,
    head: [head],
    body,
    theme: kind === 'attendance' ? 'grid' : 'striped',
    styles: { fontSize: 7, overflow: 'linebreak' },
    headStyles: { fillColor: ESN_BLUE, textColor: [255, 255, 255] },
    ...(kind === 'attendance'
      ? { columnStyles: { [signatureColumnIndex]: { cellWidth: 45, minCellHeight: 16 } } }
      : {}),
    horizontalPageBreak: true,
    horizontalPageBreakRepeat: 0,
  })

  // autoTable paginates as it renders, so the true page count is only known
  // once it's done - a second pass stamps the footer on every page instead
  // of guessing "of N" while page N+1 doesn't exist yet.
  const totalPages = doc.getNumberOfPages()
  const generatedOn = `ESN Geel — generated ${new Date().toLocaleDateString()}`
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...ESN_MUTED)
    doc.text(generatedOn, 14, pageHeight - 8)
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
  }

  return doc
}

// Both return a blob: URL instead of downloading directly - the caller
// opens it (e.g. in a new tab) so the respondent can review the PDF first;
// the browser's own PDF viewer handles saving it from there.
export async function previewSubmissionsPdf(form: FormRow, submissions: SubmissionRow[]): Promise<string> {
  const doc = await buildPdf(form, submissions, 'submissions')
  return doc.output('bloburl').toString()
}

export async function previewAttendanceSignPdf(form: FormRow, submissions: SubmissionRow[]): Promise<string> {
  const doc = await buildPdf(form, submissions, 'attendance')
  return doc.output('bloburl').toString()
}
