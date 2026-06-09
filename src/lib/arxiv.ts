import { XMLParser } from "fast-xml-parser"

import {
  MAX_EXTRACTED_CHARS,
  MAX_PDF_BYTES,
  extractPdfTextFromBuffer,
} from "@/lib/pdf"

export type ArxivPaperText = {
  arxivId: string
  title: string
  abstract: string
  authors: string[]
  pdfUrl: string
  extractedText: string
  pageCount: number
  textPreview: string
}

const ARXIV_ID_PATTERN =
  /^(?:\d{4}\.\d{4,5}(?:v\d+)?|[a-z-]+(?:\.[a-z]{2})?\/\d{7}(?:v\d+)?)$/i

type ArxivAtomEntry = {
  id?: string
  title?: string
  summary?: string
  author?: { name?: string } | Array<{ name?: string }>
  link?: ArxivAtomLink | ArxivAtomLink[]
}

type ArxivAtomLink = {
  href?: string
  title?: string
  type?: string
}

export function normalizeArxivId(value: string) {
  const withoutUrl = value
    .trim()
    .replace(/^https?:\/\/(?:www\.)?arxiv\.org\/(?:abs|pdf)\//i, "")
    .replace(/^arxiv:/i, "")
    .replace(/[?#].*$/, "")
    .replace(/\.pdf$/i, "")

  if (!ARXIV_ID_PATTERN.test(withoutUrl)) {
    throw new Error("Enter a valid arXiv ID, for example 2401.12345 or cs/0112017.")
  }

  return withoutUrl
}

export async function extractArxivPaperText(arxivIdInput: string) {
  const arxivId = normalizeArxivId(arxivIdInput)
  const metadata = await fetchArxivMetadata(arxivId)
  const pdfUrl = metadata.pdfUrl || `https://arxiv.org/pdf/${arxivId}`
  const pdfBuffer = await downloadPdf(pdfUrl)
  const textResult = await extractPdfTextFromBuffer(pdfBuffer)
  const extractedText = cleanText(textResult.text).slice(0, MAX_EXTRACTED_CHARS)
  const abstract = cleanText(metadata.abstract)

  return {
    arxivId,
    title: cleanText(metadata.title) || `arXiv ${arxivId}`,
    abstract,
    authors: metadata.authors,
    pdfUrl,
    extractedText,
    pageCount: textResult.pageCount,
    textPreview: buildInputText(abstract, extractedText),
  } satisfies ArxivPaperText
}

async function fetchArxivMetadata(arxivId: string) {
  const response = await fetch(
    `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(arxivId)}`,
    {
      headers: {
        "User-Agent": "SciBite MVP (mailto:hello@example.com)",
      },
    }
  )

  if (!response.ok) {
    throw new Error(`arXiv metadata request failed with ${response.status}.`)
  }

  const xml = await response.text()
  const parser = new XMLParser({
    attributeNamePrefix: "",
    ignoreAttributes: false,
    trimValues: true,
  })
  const parsed = parser.parse(xml) as {
    feed?: { entry?: ArxivAtomEntry | ArxivAtomEntry[] }
  }
  const entry = Array.isArray(parsed.feed?.entry)
    ? parsed.feed?.entry[0]
    : parsed.feed?.entry

  if (!entry) {
    throw new Error("No arXiv paper was found for that ID.")
  }

  const links = Array.isArray(entry.link) ? entry.link : entry.link ? [entry.link] : []
  const pdfLink =
    links.find((link) => link.title === "pdf") ??
    links.find((link) => link.type === "application/pdf")

  return {
    title: entry.title ?? "",
    abstract: entry.summary ?? "",
    authors: getAuthors(entry.author),
    pdfUrl: pdfLink?.href,
  }
}

function getAuthors(author: ArxivAtomEntry["author"]) {
  if (!author) {
    return []
  }

  const authors = Array.isArray(author) ? author : [author]

  return authors
    .map((item) => cleanText(item.name ?? ""))
    .filter(Boolean)
}

async function downloadPdf(pdfUrl: string) {
  const response = await fetch(pdfUrl, {
    headers: {
      Accept: "application/pdf",
      "User-Agent": "SciBite MVP (mailto:hello@example.com)",
    },
  })

  if (!response.ok) {
    throw new Error(`PDF download failed with ${response.status}.`)
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0)
  if (contentLength > MAX_PDF_BYTES) {
    throw new Error("That PDF is too large for the MVP extractor.")
  }

  const arrayBuffer = await response.arrayBuffer()
  if (arrayBuffer.byteLength > MAX_PDF_BYTES) {
    throw new Error("That PDF is too large for the MVP extractor.")
  }

  return new Uint8Array(arrayBuffer)
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function buildInputText(abstract: string, extractedText: string) {
  const pieces = []

  if (abstract) {
    pieces.push(`Abstract:\n${abstract}`)
  }

  if (extractedText) {
    pieces.push(`PDF text excerpt:\n${extractedText}`)
  }

  return pieces.join("\n\n")
}
