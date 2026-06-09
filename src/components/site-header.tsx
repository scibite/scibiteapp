import Link from "next/link"
import { ArrowRight, BookOpenText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { buildSciBiteQuery, sampleSciBiteInput } from "@/lib/scibite"

export function SiteHeader() {
  const demoHref = `/result?${buildSciBiteQuery(sampleSciBiteInput)}`

  return (
    <header className="border-b border-blue-100/80 bg-white/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-zinc-950">
          <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            <BookOpenText className="size-5" />
          </span>
          <span className="font-heading text-lg font-semibold tracking-normal text-zinc-950">
            SciBite
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden rounded-lg sm:inline-flex">
            <Link href={demoHref}>View Sample</Link>
          </Button>
          <Button asChild className="rounded-lg bg-blue-700 hover:bg-blue-800">
            <Link href="/create">
              Start
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
