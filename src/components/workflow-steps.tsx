import { ArrowRight, Boxes, FileText, Send, WandSparkles } from "lucide-react"

const steps = [
  {
    title: "Input",
    description: "Paste a title and abstract.",
    icon: FileText,
  },
  {
    title: "Extract",
    description: "Separate problem, method, and limits.",
    icon: Boxes,
  },
  {
    title: "Personalize",
    description: "Shape the explanation through a lens.",
    icon: WandSparkles,
  },
  {
    title: "Deliver",
    description: "Review, copy, or switch styles.",
    icon: Send,
  },
]

export function WorkflowSteps() {
  return (
    <section className="border-y border-zinc-100 bg-zinc-50/70">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">Workflow</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">
              Input to insight in four steps
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-zinc-600">
            A simple MVP pipeline that feels complete today and can later be
            connected to real extraction and generation services.
          </p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <div key={step.title} className="relative">
                <div className="h-full rounded-lg border border-zinc-100 bg-white p-5 shadow-sm">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-zinc-950">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 ? (
                  <ArrowRight className="absolute -right-5 top-1/2 z-10 hidden size-5 -translate-y-1/2 text-blue-300 md:block" />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
