import Link from "next/link"
import {
  ArrowRight,
  BrainCircuit,
  Clock3,
  FileText,
  Network,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { buildSciBiteQuery, sampleSciBiteInput } from "@/lib/scibite"

const valueCards = [
  {
    title: "Faster Learning",
    description: "Turn hours of reading into a focused 10-minute explanation.",
    icon: Clock3,
  },
  {
    title: "Personalized Lens",
    description:
      "Explain the same paper through gaming, business, daily life, or pop culture.",
    icon: Sparkles,
  },
  {
    title: "Source-Aware Output",
    description:
      "Separate the problem, method, findings, and limitations for clearer review.",
    icon: ShieldCheck,
  },
]

export function HeroSection() {
  const demoHref = `/result?${buildSciBiteQuery(sampleSciBiteInput)}`

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-18 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="mx-auto h-7 rounded-lg border-blue-100 bg-blue-50 px-3 text-blue-700"
          >
            AI-powered science translator
          </Badge>
          <h1 className="mt-6 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl lg:text-6xl">
            Dense research, explained your way.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
            Turn academic papers into personalized, easy-to-read insights using
            familiar analogies.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="w-full rounded-lg bg-blue-700 shadow-sm hover:bg-blue-800 sm:w-auto"
            >
              <Link href="/create">
                Start SciBite
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-lg border-blue-100 bg-white hover:bg-blue-50 sm:w-auto"
            >
              <Link href={demoHref}>View Sample</Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-blue-100 bg-blue-50/60 p-3 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_80px_1fr] lg:items-stretch">
            <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-950">
                <FileText className="size-4 text-blue-700" />
                Paper abstract
              </div>
              <div className="mt-4 space-y-3">
                <div className="h-2.5 w-11/12 rounded-full bg-zinc-200" />
                <div className="h-2.5 w-full rounded-full bg-zinc-200" />
                <div className="h-2.5 w-9/12 rounded-full bg-zinc-200" />
                <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-sm leading-6 text-zinc-600">
                  Planning, reflection, tool use, memory, and limitations.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center rounded-lg border border-blue-100 bg-white py-5 text-blue-700 shadow-sm">
              <div className="flex items-center gap-3 lg:flex-col">
                <BrainCircuit className="size-7" />
                <ArrowRight className="size-5 lg:rotate-90" />
                <Network className="size-7" />
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-950">
                <Sparkles className="size-4 text-blue-700" />
                Personalized SciBite
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {["Problem", "Method", "Analogy", "Limit"].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-600">
                The same abstract becomes a clear explanation shaped for the way
                your audience thinks.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {valueCards.map((card) => {
            const Icon = card.icon

            return (
              <Card
                key={card.title}
                className="rounded-lg border border-zinc-100 shadow-sm"
              >
                <CardHeader>
                  <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Icon className="size-5" />
                  </span>
                  <CardTitle className="text-lg text-zinc-950">
                    {card.title}
                  </CardTitle>
                  <CardDescription className="leading-6">
                    {card.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
