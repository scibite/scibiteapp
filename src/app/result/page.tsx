import { ResultExperience } from "@/app/result/result-experience"
import { SiteHeader } from "@/components/site-header"
import {
  parseSciBiteInput,
  sampleSciBiteInput,
} from "@/lib/scibite"

type ResultPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ResultPage({ searchParams }: ResultPageProps) {
  const params = await searchParams
  const useLocalInput = params.source === "local"
  const isDemoFallback = !useLocalInput && !params.title && !params.abstract
  const input = parseSciBiteInput(params, sampleSciBiteInput)

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <SiteHeader />
      <ResultExperience
        initialInput={input}
        isDemoFallback={isDemoFallback}
        useLocalInput={useLocalInput}
      />
    </main>
  )
}
