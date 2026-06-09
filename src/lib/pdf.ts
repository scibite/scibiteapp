import { readFileSync } from "node:fs"
import { join } from "node:path"

import { PDFParse } from "pdf-parse"

export const MAX_PDF_BYTES = 24 * 1024 * 1024
export const MAX_EXTRACTED_CHARS = 28000
export const PDF_PAGES_TO_PARSE = 8

const PDF_WORKER_PATH = join(
  process.cwd(),
  "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs"
)

let isPdfWorkerConfigured = false
let pdfWorkerDataUrl: string | null = null

export type ExtractedPdfText = {
  text: string
  pageCount: number
}

export async function extractPdfTextFromBuffer(
  data: Uint8Array
): Promise<ExtractedPdfText> {
  configurePdfWorker()

  const parser = new PDFParse({ data })

  try {
    const result = await parser.getText({ first: PDF_PAGES_TO_PARSE })

    return {
      text: result.text,
      pageCount: result.total,
    }
  } finally {
    await parser.destroy()
  }
}

function configurePdfWorker() {
  if (isPdfWorkerConfigured) {
    return
  }

  PDFParse.setWorker(getPdfWorkerDataUrl())
  isPdfWorkerConfigured = true
}

function getPdfWorkerDataUrl() {
  if (pdfWorkerDataUrl) {
    return pdfWorkerDataUrl
  }

  const worker = readFileSync(PDF_WORKER_PATH)
  pdfWorkerDataUrl = `data:text/javascript;base64,${worker.toString("base64")}`

  return pdfWorkerDataUrl
}
