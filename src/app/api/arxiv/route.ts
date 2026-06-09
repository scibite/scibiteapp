import { extractArxivPaperText } from "@/lib/arxiv"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { arxivId?: unknown }

    if (typeof body.arxivId !== "string" || !body.arxivId.trim()) {
      return Response.json(
        { error: "arxivId is required." },
        { status: 400 }
      )
    }

    const paper = await extractArxivPaperText(body.arxivId)

    return Response.json({ paper })
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to extract that arXiv paper.",
      },
      { status: 500 }
    )
  }
}
