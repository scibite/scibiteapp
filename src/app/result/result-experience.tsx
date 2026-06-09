"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, Copy, RefreshCw, RotateCcw } from "lucide-react"

import { LoadingPipeline } from "@/components/loading-pipeline"
import { ResultCard } from "@/components/result-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { readApiResponse } from "@/lib/api-response"
import {
  buildSciBiteQuery,
  formatSciBiteForCopy,
  getSciBiteModelLabel,
  type SciBiteInput,
  type SciBiteResult,
} from "@/lib/scibite"

type ResultExperienceProps = {
  initialInput: SciBiteInput
  isDemoFallback: boolean
  useLocalInput: boolean
}

type GenerateResponse = {
  provider?: "mock" | "nvidia"
  model?: string
  result?: SciBiteResult
  error?: string
}

export function ResultExperience({
  initialInput,
  isDemoFallback,
  useLocalInput,
}: ResultExperienceProps) {
  const [input, setInput] = useState(initialInput)
  const [result, setResult] = useState<SciBiteResult | null>(null)
  const [provider, setProvider] = useState<GenerateResponse["provider"]>()
  const [model, setModel] = useState<string>(initialInput.model)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingComplete, setIsLoadingComplete] = useState(false)
  const [copyLabel, setCopyLabel] = useState("Copy Result")
  const [retryCount, setRetryCount] = useState(0)

  const query = useMemo(() => buildSciBiteQuery(input), [input])
  const switchLensHref =
    input.abstract.length > 1600 ? "/create?source=local#lens" : `/create?${query}#lens`

  const completeLoading = useCallback(() => {
    setIsLoadingComplete(true)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      const nextInput = useLocalInput ? getSavedInput(initialInput) : initialInput

      setInput(nextInput)
      window.localStorage.setItem("scibite:last-input", JSON.stringify(nextInput))
      setResult(null)
      setProvider(undefined)
      setModel(nextInput.model)
      setError(null)
      setIsLoadingComplete(false)
      generate(nextInput)
    }, 0)

    async function generate(nextInput: SciBiteInput) {
      try {
        const response = await fetch("/api/scibite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ input: nextInput }),
          signal: controller.signal,
        })
        const data = await readApiResponse<GenerateResponse>(
          response,
          "Unable to generate the SciBite result."
        )

        if (!response.ok || !data.result) {
          throw new Error(data.error ?? "Unable to generate the SciBite result.")
        }

        setResult(data.result)
        setProvider(data.provider)
        setModel(data.model ?? nextInput.model)
      } catch (currentError) {
        if (controller.signal.aborted) {
          return
        }

        setError(
          currentError instanceof Error
            ? currentError.message
            : "Unable to generate the SciBite result."
        )
      }
    }

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [initialInput, retryCount, useLocalInput])

  async function copyResult() {
    if (!result) {
      return
    }

    const text = formatSciBiteForCopy(result)

    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.setAttribute("readonly", "")
      textarea.style.position = "absolute"
      textarea.style.left = "-9999px"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }

    setCopyLabel("Copied")
    window.setTimeout(() => setCopyLabel("Copy Result"), 1600)
  }

  if (!isLoadingComplete || (!result && !error)) {
    return <LoadingPipeline onComplete={completeLoading} />
  }

  if (error || !result) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center px-4 py-16">
        <Card className="rounded-lg border border-red-100 shadow-sm">
          <CardHeader>
            <span className="flex size-10 items-center justify-center rounded-lg bg-red-50 text-red-700">
              <AlertCircle className="size-5" />
            </span>
            <CardTitle className="text-xl text-zinc-950">
              Generation failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm leading-6 text-zinc-600">
              {error ?? "Unable to generate the SciBite result."}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="rounded-lg bg-blue-700 hover:bg-blue-800"
                onClick={() => setRetryCount((count) => count + 1)}
              >
                <RefreshCw className="size-4" />
                Retry
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-lg border-zinc-200 bg-white"
              >
                <Link href="/create">Create Another</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            {isDemoFallback ? (
              <Badge
                variant="outline"
                className="h-7 rounded-lg border-amber-200 bg-amber-50 px-3 text-amber-800"
              >
                Demo sample
              </Badge>
            ) : null}
            <Badge
              variant="outline"
              className="h-7 rounded-lg border-blue-100 bg-blue-50 px-3 text-blue-700"
            >
              {result.meta.lens}
            </Badge>
            <Badge
              variant="outline"
              className="h-7 rounded-lg border-zinc-200 bg-white px-3 text-zinc-700"
            >
              {result.meta.language}
            </Badge>
            <Badge
              variant="outline"
              className="h-7 rounded-lg border-zinc-200 bg-white px-3 text-zinc-700"
            >
              {provider === "nvidia" ? "NVIDIA" : "Mock"}
            </Badge>
            <Badge
              variant="outline"
              className="h-7 rounded-lg border-zinc-200 bg-white px-3 text-zinc-700"
            >
              {getSciBiteModelLabel(model)}
            </Badge>
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
            {result.title}
          </h1>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg border-blue-100 bg-white hover:bg-blue-50"
            onClick={copyResult}
          >
            <Copy className="size-4" />
            {copyLabel}
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-lg border-zinc-200 bg-white hover:bg-zinc-50"
          >
            <Link href="/create">
              <RefreshCw className="size-4" />
              Create Another
            </Link>
          </Button>
          <Button asChild className="rounded-lg bg-blue-700 hover:bg-blue-800">
            <Link href={switchLensHref}>
              <RotateCcw className="size-4" />
              Switch Lens
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4">
          {result.sections.map((section) => (
            <ResultCard key={section.key} section={section} />
          ))}
        </div>

        <aside className="space-y-4">
          <Card className="rounded-lg border border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-950">
                Paper source
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {input.source === "arxiv" && input.arxivId ? (
                <SettingsRow label="arXiv" value={input.arxivId} />
              ) : null}
              {input.source === "pdf" && input.pdfFileName ? (
                <SettingsRow label="PDF" value={input.pdfFileName} />
              ) : null}
              {input.pdfUrl ? (
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-lg border-blue-100 bg-white hover:bg-blue-50"
                >
                  <a href={input.pdfUrl} target="_blank" rel="noreferrer">
                    Open PDF
                  </a>
                </Button>
              ) : null}
              <p className="max-h-80 overflow-y-auto text-sm leading-6 text-zinc-600">
                {input.abstract}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-zinc-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-950">
                Generation settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <SettingsRow label="Language" value={input.language} />
              <Separator />
              <SettingsRow label="Lens" value={input.lens} />
              <Separator />
              <SettingsRow label="Length" value={input.length} />
              <Separator />
              <SettingsRow label="Model" value={getSciBiteModelLabel(model)} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function getSavedInput(fallback: SciBiteInput) {
  const storedInput = window.localStorage.getItem("scibite:last-input")

  if (!storedInput) {
    return fallback
  }

  try {
    return { ...fallback, ...JSON.parse(storedInput) } as SciBiteInput
  } catch {
    window.localStorage.removeItem("scibite:last-input")
    return fallback
  }
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-medium text-zinc-950">{value}</span>
    </div>
  )
}
