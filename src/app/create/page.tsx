import { CreateForm } from "@/app/create/create-form"
import { SiteHeader } from "@/components/site-header"
import { emptySciBiteInput, parseSciBiteInput } from "@/lib/scibite"

type CreatePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const initialInput = parseSciBiteInput(
    await searchParams,
    emptySciBiteInput
  )

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <CreateForm initialInput={initialInput} />
      </div>
    </main>
  )
}
