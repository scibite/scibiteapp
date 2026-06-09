import { HeroSection } from "@/components/hero-section"
import { SiteHeader } from "@/components/site-header"
import { WorkflowSteps } from "@/components/workflow-steps"

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <SiteHeader />
      <HeroSection />
      <WorkflowSteps />
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Ready for the next paper
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">
                  Explain research in the language your team already uses
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-zinc-700">
                Choose a familiar lens, keep the academic structure visible, and
                leave with a concise result that is easy to discuss.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
