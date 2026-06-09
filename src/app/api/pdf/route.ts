import {
  MAX_EXTRACTED_CHARS,
  MAX_PDF_BYTES,
  extractPdfTextFromBuffer,
} from "@/lib/pdf"
import {
  MAX_VERCEL_PDF_UPLOAD_BYTES,
  formatFileSize,
} from "@/lib/pdf-limits"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("pdf")

    if (!(file instanceof File)) {
      return Response.json(
        { error: "Upload a PDF file first." },
        { status: 400 }
      )
    }

    const looksLikePdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")

    if (!looksLikePdf) {
      return Response.json(
        { error: "Only PDF files are supported." },
        { status: 400 }
      )
    }

    if (file.size > MAX_VERCEL_PDF_UPLOAD_BYTES) {
      return Response.json(
        {
          error: `That PDF is ${formatFileSize(
            file.size
          )}. Vercel-hosted uploads must be ${formatFileSize(
            MAX_VERCEL_PDF_UPLOAD_BYTES
          )} or smaller.`,
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_PDF_BYTES) {
      return Response.json(
        { error: "That PDF is too large for the MVP extractor." },
        { status: 400 }
      )
    }

    const buffer = new Uint8Array(await file.arrayBuffer())
    const textResult = await extractPdfTextFromBuffer(buffer)
    const extractedText = cleanText(textResult.text).slice(0, MAX_EXTRACTED_CHARS)

    if (!extractedText) {
      return Response.json(
        { error: "No readable text was found in that PDF." },
        { status: 400 }
      )
    }

    return Response.json({
      paper: {
        title: titleFromFileName(file.name),
        fileName: file.name,
        textPreview: buildInputText(file.name, extractedText),
        pageCount: textResult.pageCount,
      },
    })
  } catch (error) {
    console.error("[api/pdf] PDF extraction failed", error)

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to extract that PDF.",
      },
      { status: 500 }
    )
  }
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function titleFromFileName(fileName: string) {
  return fileName
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Uploaded PDF"
}

function buildInputText(fileName: string, extractedText: string) {
  return [`Source PDF: ${fileName}`, `PDF text excerpt:\n${extractedText}`].join(
    "\n\n"
  )
}
