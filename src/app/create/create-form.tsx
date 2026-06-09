"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BriefcaseBusiness,
  Clapperboard,
  ClipboardPaste,
  Cpu,
  FileDown,
  FileText,
  FileUp,
  Gamepad2,
  Gauge,
  Languages,
  Loader2,
  SearchCheck,
  Sparkles,
  Utensils,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { LensCard } from "@/components/lens-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  emptySciBiteInput,
  getSciBiteModelHelper,
  getSciBiteModelLabel,
  lensHelperText,
  lensOptions,
  languageOptions,
  readingLengthOptions,
  sampleSciBiteInput,
  scibiteModelOptions,
  type ExplanationLens,
  type SciBiteModel,
  type OutputLanguage,
  type ReadingLength,
  type SciBiteInput,
} from "@/lib/scibite"

type ArxivResponse = {
  paper?: {
    arxivId: string
    title: string
    pdfUrl: string
    textPreview: string
    pageCount: number
  }
  error?: string
}

type PdfResponse = {
  paper?: {
    title: string
    fileName: string
    textPreview: string
    pageCount: number
  }
  error?: string
}

const lensIcons = {
  "Game Style": Gamepad2,
  "Daily Life Style": Utensils,
  "Executive Style": BriefcaseBusiness,
  "Pop Culture Style": Clapperboard,
} satisfies Record<ExplanationLens, LucideIcon>

type CreateFormProps = {
  initialInput: SciBiteInput
}

export function CreateForm({ initialInput }: CreateFormProps) {
  const router = useRouter()
  const [input, setInput] = useState<SciBiteInput>({
    ...emptySciBiteInput,
    ...initialInput,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [arxivId, setArxivId] = useState(initialInput.arxivId ?? "")
  const [isFetchingArxiv, setIsFetchingArxiv] = useState(false)
  const [arxivStatus, setArxivStatus] = useState<string | null>(
    initialInput.arxivId ? `Loaded arXiv ${initialInput.arxivId}` : null
  )
  const [arxivError, setArxivError] = useState<string | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfInputKey, setPdfInputKey] = useState(0)
  const [isExtractingPdf, setIsExtractingPdf] = useState(false)
  const [pdfStatus, setPdfStatus] = useState<string | null>(
    initialInput.source === "pdf" && initialInput.pdfFileName
      ? `Loaded PDF ${initialInput.pdfFileName}`
      : null
  )
  const [pdfError, setPdfError] = useState<string | null>(null)

  const selectedLensHelper = useMemo(
    () => lensHelperText[input.lens],
    [input.lens]
  )
  const selectedModelHelper = useMemo(
    () => getSciBiteModelHelper(input.model),
    [input.model]
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get("source") !== "local") {
      return
    }

    const storedInput = window.localStorage.getItem("scibite:last-input")
    if (!storedInput) {
      return
    }

    try {
      const parsed = JSON.parse(storedInput) as SciBiteInput
      const timer = window.setTimeout(() => {
        setInput({ ...emptySciBiteInput, ...parsed })
        setArxivId(parsed.arxivId ?? "")
        setArxivStatus(parsed.arxivId ? `Loaded arXiv ${parsed.arxivId}` : null)
        setPdfStatus(
          parsed.source === "pdf" && parsed.pdfFileName
            ? `Loaded PDF ${parsed.pdfFileName}`
            : null
        )
      }, 0)

      return () => window.clearTimeout(timer)
    } catch {
      window.localStorage.removeItem("scibite:last-input")
    }
  }, [])

  function updateInput<K extends keyof SciBiteInput>(
    key: K,
    value: SciBiteInput[K]
  ) {
    setInput((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function useSamplePaper() {
    setInput({ ...sampleSciBiteInput, source: "manual" })
    setArxivId("")
    setArxivStatus(null)
    setArxivError(null)
    clearPdfUpload()
  }

  function clearPdfUpload() {
    setPdfFile(null)
    setPdfStatus(null)
    setPdfError(null)
    setPdfInputKey((key) => key + 1)
  }

  async function fetchArxivPaper() {
    if (!arxivId.trim()) {
      setArxivError("Enter an arXiv ID first.")
      return
    }

    setIsFetchingArxiv(true)
    setArxivError(null)
    setArxivStatus("Downloading and extracting the arXiv PDF...")

    try {
      const response = await fetch("/api/arxiv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ arxivId }),
      })
      const data = (await response.json()) as ArxivResponse

      if (!response.ok || !data.paper) {
        throw new Error(data.error ?? "Unable to load that arXiv paper.")
      }

      setInput((current) => ({
        ...current,
        title: data.paper!.title,
        abstract: data.paper!.textPreview,
        source: "arxiv",
        arxivId: data.paper!.arxivId,
        pdfUrl: data.paper!.pdfUrl,
        pdfFileName: undefined,
      }))
      setArxivId(data.paper.arxivId)
      clearPdfUpload()
      setArxivStatus(
        `Loaded arXiv ${data.paper.arxivId} and extracted text from the PDF.`
      )
    } catch (error) {
      setArxivError(
        error instanceof Error
          ? error.message
          : "Unable to load that arXiv paper."
      )
      setArxivStatus(null)
    } finally {
      setIsFetchingArxiv(false)
    }
  }

  async function extractPdfFile() {
    if (!pdfFile) {
      setPdfError("Choose a PDF file first.")
      return
    }

    setIsExtractingPdf(true)
    setPdfError(null)
    setPdfStatus("Extracting readable text from the PDF...")

    try {
      const formData = new FormData()
      formData.set("pdf", pdfFile)

      const response = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
      })
      const data = (await response.json()) as PdfResponse

      if (!response.ok || !data.paper) {
        throw new Error(data.error ?? "Unable to extract that PDF.")
      }

      setInput((current) => ({
        ...current,
        title: data.paper!.title,
        abstract: data.paper!.textPreview,
        source: "pdf",
        pdfFileName: data.paper!.fileName,
        arxivId: undefined,
        pdfUrl: undefined,
      }))
      setArxivId("")
      setArxivStatus(null)
      setArxivError(null)
      setPdfStatus(
        `Loaded ${data.paper.fileName} and extracted text from ${data.paper.pageCount} pages.`
      )
    } catch (error) {
      setPdfError(
        error instanceof Error ? error.message : "Unable to extract that PDF."
      )
      setPdfStatus(null)
    } finally {
      setIsExtractingPdf(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    window.localStorage.setItem("scibite:last-input", JSON.stringify(input))
    router.push("/result?source=local")
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge
              variant="outline"
              className="h-7 rounded-lg border-blue-100 bg-blue-50 px-3 text-blue-700"
            >
              New SciBite
            </Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
              Translate a paper abstract
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Pick the audience lens, language, and depth for a clear,
              source-aware explanation.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg border-blue-100 bg-white hover:bg-blue-50"
            onClick={useSamplePaper}
          >
            <ClipboardPaste className="size-4" />
            Use Sample AI Agent Paper
          </Button>
        </div>

        <section className="rounded-xl border border-blue-100 bg-blue-50/70 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FileDown className="size-5 text-blue-700" />
            <h2 className="text-lg font-semibold text-zinc-950">
              Load from arXiv
            </h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="grid gap-2">
              <Label htmlFor="arxiv-id">arXiv ID or URL</Label>
              <Input
                id="arxiv-id"
                value={arxivId}
                onChange={(event) => setArxivId(event.target.value)}
                placeholder="2401.12345 or https://arxiv.org/abs/2401.12345"
                className="h-11 rounded-lg bg-white"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                disabled={isFetchingArxiv}
                onClick={fetchArxivPaper}
                className="h-11 rounded-lg border-blue-100 bg-white hover:bg-blue-50"
              >
                {isFetchingArxiv ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <SearchCheck className="size-4" />
                )}
                Fetch PDF Text
              </Button>
            </div>
          </div>
          {arxivStatus ? (
            <p className="mt-3 text-sm leading-6 text-blue-900">{arxivStatus}</p>
          ) : null}
          {arxivError ? (
            <p className="mt-3 text-sm leading-6 text-red-700">{arxivError}</p>
          ) : null}
        </section>

        <section className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FileUp className="size-5 text-blue-700" />
            <h2 className="text-lg font-semibold text-zinc-950">
              Upload a PDF
            </h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="grid gap-2">
              <Label htmlFor="pdf-file">PDF file</Label>
              <Input
                key={pdfInputKey}
                id="pdf-file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => {
                  setPdfFile(event.target.files?.[0] ?? null)
                  setPdfError(null)
                  setPdfStatus(null)
                }}
                className="h-11 rounded-lg bg-white file:mr-4 file:border-0 file:bg-transparent file:text-sm file:font-medium"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                disabled={isExtractingPdf}
                onClick={extractPdfFile}
                className="h-11 rounded-lg border-zinc-200 bg-white hover:bg-blue-50"
              >
                {isExtractingPdf ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileUp className="size-4" />
                )}
                Extract PDF Text
              </Button>
            </div>
          </div>
          {pdfStatus ? (
            <p className="mt-3 text-sm leading-6 text-blue-900">{pdfStatus}</p>
          ) : null}
          {pdfError ? (
            <p className="mt-3 text-sm leading-6 text-red-700">{pdfError}</p>
          ) : null}
        </section>

        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-blue-700" />
            <h2 className="text-lg font-semibold text-zinc-950">Paper input</h2>
          </div>
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="paper-title">Paper title</Label>
              <Input
                id="paper-title"
                required
                value={input.title}
                onChange={(event) => updateInput("title", event.target.value)}
                placeholder="Paste the paper title"
                className="h-11 rounded-lg bg-zinc-50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paper-abstract">Paper abstract or pasted text</Label>
              <Textarea
                id="paper-abstract"
                required
                value={input.abstract}
                onChange={(event) =>
                  updateInput("abstract", event.target.value)
                }
                placeholder="Paste the abstract, paper excerpt, or fetch text from arXiv"
                className="min-h-56 rounded-lg bg-zinc-50"
              />
            </div>
          </div>
        </section>

        <Separator className="bg-zinc-100" />

        <section className="space-y-5" id="lens">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-blue-700" />
            <h2 className="text-lg font-semibold text-zinc-950">
              Output settings
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="grid gap-2">
              <Label>Output language</Label>
              <Select
                value={input.language}
                onValueChange={(value) =>
                  updateInput("language", value as OutputLanguage)
                }
              >
                <SelectTrigger className="h-11 w-full rounded-lg bg-zinc-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Explanation lens</Label>
              <Select
                value={input.lens}
                onValueChange={(value) =>
                  updateInput("lens", value as ExplanationLens)
                }
              >
                <SelectTrigger className="h-11 w-full rounded-lg bg-zinc-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lensOptions.map((lens) => (
                    <SelectItem key={lens} value={lens}>
                      {lens}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Reading length</Label>
              <Select
                value={input.length}
                onValueChange={(value) =>
                  updateInput("length", value as ReadingLength)
                }
              >
                <SelectTrigger className="h-11 w-full rounded-lg bg-zinc-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {readingLengthOptions.map((length) => (
                    <SelectItem key={length} value={length}>
                      {length}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>LLM model</Label>
              <Select
                value={input.model}
                onValueChange={(value) =>
                  updateInput("model", value as SciBiteModel)
                }
              >
                <SelectTrigger className="h-11 w-full rounded-lg bg-zinc-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scibiteModelOptions.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
              {selectedLensHelper}
            </div>
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-700">
              <span className="font-medium text-zinc-950">
                {getSciBiteModelLabel(input.model)}:
              </span>{" "}
              {selectedModelHelper}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {lensOptions.map((lens) => {
              const Icon = lensIcons[lens]

              return (
                <LensCard
                  key={lens}
                  title={lens}
                  helper={lensHelperText[lens]}
                  icon={Icon}
                  selected={input.lens === lens}
                  onSelect={() => updateInput("lens", lens)}
                />
              )
            })}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-700 hover:bg-blue-800"
          >
            Generate SciBite
            <ArrowRight className="size-4" />
          </Button>
          <p className="text-sm text-zinc-500">
            Your result appears after a short extraction pass.
          </p>
        </div>
      </div>

      <aside className="hidden lg:block">
        <Card className="sticky top-6 rounded-lg border border-blue-100 shadow-sm">
          <CardHeader>
            <Badge
              variant="outline"
              className="h-7 rounded-lg border-blue-100 bg-blue-50 px-3 text-blue-700"
            >
              Preview
            </Badge>
            <CardTitle className="text-xl text-zinc-950">
              Selected options
            </CardTitle>
            <CardDescription>
              This is what SciBite will use for generation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-xs font-medium uppercase text-zinc-500">
                Paper
              </p>
              <p className="mt-1 line-clamp-3 text-sm font-medium leading-6 text-zinc-950">
                {input.title || "Untitled paper"}
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <PreviewRow
                icon={Languages}
                label="Language"
                value={input.language}
              />
              <PreviewRow icon={Sparkles} label="Lens" value={input.lens} />
              <PreviewRow icon={Gauge} label="Length" value={input.length} />
              <PreviewRow
                icon={FileDown}
                label="Source"
                value={getInputSourceLabel(input)}
              />
              <PreviewRow
                icon={Cpu}
                label="Model"
                value={getSciBiteModelLabel(input.model)}
              />
            </div>

            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-sm leading-6 text-zinc-600">
              {input.abstract
                ? `${input.abstract.slice(0, 180)}${
                    input.abstract.length > 180 ? "..." : ""
                  }`
                : "Paste an abstract to see a short preview here."}
            </div>
          </CardContent>
        </Card>
      </aside>
    </form>
  )
}

function PreviewRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-zinc-600">
        <Icon className="size-4 text-blue-700" />
        {label}
      </div>
      <span className="text-right text-sm font-medium text-zinc-950">
        {value}
      </span>
    </div>
  )
}

function getInputSourceLabel(input: SciBiteInput) {
  if (input.source === "arxiv" && input.arxivId) {
    return `arXiv ${input.arxivId}`
  }

  if (input.source === "pdf" && input.pdfFileName) {
    return `PDF ${input.pdfFileName}`
  }

  return "Manual text"
}
