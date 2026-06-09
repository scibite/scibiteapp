import {
  BadgeCheck,
  Lightbulb,
  ListChecks,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { SciBiteSection } from "@/lib/scibite"

const sectionIcons: Record<SciBiteSection["key"], typeof Sparkles> = {
  bite: Sparkles,
  problem: Target,
  method: SearchCheck,
  takeaways: ListChecks,
  analogy: Lightbulb,
  matters: BadgeCheck,
  accuracy: ShieldCheck,
}

type ResultCardProps = {
  section: SciBiteSection
}

export function ResultCard({ section }: ResultCardProps) {
  const Icon = sectionIcons[section.key]

  return (
    <Card className="rounded-lg border border-zinc-100 shadow-sm">
      <CardHeader className="gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Icon className="size-5" />
        </span>
        <CardTitle className="text-lg text-zinc-950">{section.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {Array.isArray(section.content) ? (
          <ul className="space-y-3 text-sm leading-6 text-zinc-700">
            {section.content.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-700" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-7 text-zinc-700">{section.content}</p>
        )}
      </CardContent>
    </Card>
  )
}
