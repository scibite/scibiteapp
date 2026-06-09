export const MAX_PDF_BYTES = 24 * 1024 * 1024
export const MAX_EXTRACTED_CHARS = 28000
export const PDF_PAGES_TO_PARSE = 8

let isPdfWorkerConfigured = false

export type ExtractedPdfText = {
  text: string
  pageCount: number
}

export async function extractPdfTextFromBuffer(
  data: Uint8Array
): Promise<ExtractedPdfText> {
  const { PDFParse } = await import("pdf-parse")

  await configurePdfWorker(PDFParse)

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

async function configurePdfWorker(PDFParse: typeof import("pdf-parse").PDFParse) {
  if (isPdfWorkerConfigured) {
    return
  }

  const worker = await import("pdf-parse/worker")

  PDFParse.setWorker(worker.getData())
  isPdfWorkerConfigured = true
}
