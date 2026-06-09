import {
  lensOptions,
  languageOptions,
  readingLengthOptions,
  scibiteModelOptions,
  type ExplanationLens,
  type OutputLanguage,
  type ReadingLength,
  type SciBiteModel,
  type SciBiteInput,
} from "@/lib/scibite"
import { generateSciBite } from "@/lib/scibite-ai"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { input?: Partial<SciBiteInput> }
    const input = parseInput(body.input)
    const generated = await generateSciBite(input)

    return Response.json(generated)
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate a SciBite result.",
      },
      { status: 500 }
    )
  }
}

function parseInput(input: Partial<SciBiteInput> | undefined): SciBiteInput {
  if (!input) {
    throw new Error("input is required.")
  }

  if (!input.title?.trim()) {
    throw new Error("Paper title is required.")
  }

  if (!input.abstract?.trim()) {
    throw new Error("Paper text is required.")
  }

  if (!isOutputLanguage(input.language)) {
    throw new Error("Unsupported output language.")
  }

  if (!isExplanationLens(input.lens)) {
    throw new Error("Unsupported explanation lens.")
  }

  if (!isReadingLength(input.length)) {
    throw new Error("Unsupported reading length.")
  }

  if (input.model && !isSciBiteModel(input.model)) {
    throw new Error("Unsupported LLM model.")
  }

  return {
    title: input.title.trim(),
    abstract: input.abstract.trim(),
    language: input.language,
    lens: input.lens,
    length: input.length,
    model: isSciBiteModel(input.model)
      ? input.model
      : scibiteModelOptions[0].id,
    source: isSciBiteSource(input.source) ? input.source : undefined,
    arxivId: input.arxivId,
    pdfUrl: input.pdfUrl,
    pdfFileName: input.pdfFileName,
  }
}

function isOutputLanguage(value: unknown): value is OutputLanguage {
  return typeof value === "string" && languageOptions.includes(value as OutputLanguage)
}

function isExplanationLens(value: unknown): value is ExplanationLens {
  return typeof value === "string" && lensOptions.includes(value as ExplanationLens)
}

function isReadingLength(value: unknown): value is ReadingLength {
  return typeof value === "string" && readingLengthOptions.includes(value as ReadingLength)
}

function isSciBiteModel(value: unknown): value is SciBiteModel {
  return (
    typeof value === "string" &&
    scibiteModelOptions.some((option) => option.id === value)
  )
}

function isSciBiteSource(value: unknown): value is SciBiteInput["source"] {
  return value === "manual" || value === "arxiv" || value === "pdf"
}
