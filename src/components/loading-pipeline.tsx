"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"

import { Progress } from "@/components/ui/progress"

const pipelineSteps = [
  "Reading paper text",
  "Extracting problem and method",
  "Building personalized analogy",
  "Preparing SciBite result",
]

type LoadingPipelineProps = {
  onComplete: () => void
  durationMs?: number
}

export function LoadingPipeline({
  onComplete,
  durationMs = 2600,
}: LoadingPipelineProps) {
  const [progress, setProgress] = useState(8)

  useEffect(() => {
    const startedAt = Date.now()
    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const nextProgress = Math.min(100, Math.round((elapsed / durationMs) * 100))
      setProgress(nextProgress)
    }, 120)

    const completeTimer = window.setTimeout(() => {
      setProgress(100)
      onComplete()
    }, durationMs)

    return () => {
      window.clearInterval(progressTimer)
      window.clearTimeout(completeTimer)
    }
  }, [durationMs, onComplete])

  const activeIndex = Math.min(
    pipelineSteps.length - 1,
    Math.floor(progress / (100 / pipelineSteps.length))
  )

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center px-4 py-16">
      <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Extracting paper structure
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">
              Preparing your SciBite
            </h1>
          </div>
          <Loader2 className="size-6 animate-spin text-blue-700" />
        </div>

        <Progress
          value={progress}
          className="mt-8 h-2 bg-blue-100 [&_[data-slot=progress-indicator]]:bg-blue-700"
        />

        <div className="mt-7 space-y-3">
          {pipelineSteps.map((step, index) => {
            const isComplete = index < activeIndex || progress === 100
            const isActive = index === activeIndex && progress < 100

            return (
              <div
                key={step}
                className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3"
              >
                {isComplete ? (
                  <CheckCircle2 className="size-5 text-emerald-600" />
                ) : (
                  <span className="flex size-5 items-center justify-center">
                    <span
                      className={
                        isActive
                          ? "size-2.5 animate-pulse rounded-full bg-blue-700"
                          : "size-2.5 rounded-full bg-zinc-300"
                      }
                    />
                  </span>
                )}
                <span className="text-sm font-medium text-zinc-800">
                  {step}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
