"use client"

import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type LensCardProps = {
  title: string
  helper: string
  icon: LucideIcon
  selected: boolean
  onSelect: () => void
}

export function LensCard({
  title,
  helper,
  icon: Icon,
  selected,
  onSelect,
}: LensCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "min-h-36 rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-200",
        selected
          ? "border-blue-300 bg-blue-50 ring-1 ring-blue-200"
          : "border-zinc-100"
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <Icon className="size-5" />
      </span>
      <span className="mt-4 block font-semibold text-zinc-950">{title}</span>
      <span className="mt-2 block text-sm leading-6 text-zinc-600">
        {helper}
      </span>
    </button>
  )
}
