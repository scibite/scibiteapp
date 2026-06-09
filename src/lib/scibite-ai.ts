import { jsonrepair } from "jsonrepair"

import {
  generateMockSciBite,
  defaultSciBiteModel,
  getSciBiteSectionTitle,
  scibiteSectionKeys,
  type SciBiteInput,
  type SciBiteResult,
  type SciBiteSection,
  type SciBiteSectionKey,
} from "@/lib/scibite"

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

type GenerationProvider = "mock" | "nvidia"

const DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
const DEFAULT_NVIDIA_MODEL = defaultSciBiteModel

const NVIDIA_MODEL_ALIASES: Record<string, string> = {
  "google-gemma-7b-infer": "google/gemma-7b",
  "google/gemma-7b-infer": "google/gemma-7b",
  "nvidia/Llama-3_3-Nemotron-Super-49B-v1_5":
    "nvidia/llama-3.3-nemotron-super-49b-v1.5",
  "nvidia/llama-3_3-nemotron-super-49b-v1_5":
    "nvidia/llama-3.3-nemotron-super-49b-v1.5",
  "nvidia/llama-3_1-nemotron-nano-8b-v1":
    "nvidia/llama-3.1-nemotron-nano-8b-v1",
  "meta/llama-3_1-8b-instruct": "meta/llama-3.1-8b-instruct",
  "meta/llama-3_3-70b-instruct": "meta/llama-3.3-70b-instruct",
}

export type GeneratedSciBite = {
  provider: GenerationProvider
  model: string
  result: SciBiteResult
}

export async function generateSciBite(input: SciBiteInput) {
  if (process.env.AI_MODE !== "nvidia") {
    return {
      provider: "mock",
      model: input.model,
      result: generateMockSciBite(input),
    } satisfies GeneratedSciBite
  }

  return generateNvidiaSciBite(input)
}

async function generateNvidiaSciBite(input: SciBiteInput) {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is missing.")
  }

  const baseUrl = process.env.NVIDIA_BASE_URL?.trim() || DEFAULT_NVIDIA_BASE_URL
  const model = normalizeNvidiaModel(
    input.model || process.env.NVIDIA_MODEL?.trim() || DEFAULT_NVIDIA_MODEL
  )
  const endpoint = buildNvidiaChatCompletionsEndpoint(baseUrl)
  const timeoutMs = Number(process.env.NVIDIA_TIMEOUT_MS ?? 90000)
  const controller = new AbortController()
  const timeout = windowlessSetTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: buildMessages(input),
        temperature: 0.1,
        max_tokens: maxTokensForLength(input.length),
        stream: false,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const details = await response.text()
      throw new Error(
        `NVIDIA chat completions failed at ${endpoint} with ${response.status}: ${details.slice(
          0,
          300
        )}`
      )
    }

    const data = (await response.json()) as ChatCompletionResponse
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error("NVIDIA response did not include message content.")
    }

    return {
      provider: "nvidia",
      model,
      result: normalizeModelResult(input, content),
    } satisfies GeneratedSciBite
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeNvidiaModel(model: string) {
  const trimmed = model.trim()

  return NVIDIA_MODEL_ALIASES[trimmed] ?? trimmed
}

function buildNvidiaChatCompletionsEndpoint(baseUrl: string) {
  const trimmed = baseUrl.trim().replace(/\/+$/, "")

  try {
    const url = new URL(trimmed)

    if (url.hostname === "docs.api.nvidia.com") {
      return `${DEFAULT_NVIDIA_BASE_URL}/chat/completions`
    }
  } catch {
    // Fall back to the plain string handling below.
  }

  if (trimmed.endsWith("/chat/completions")) {
    return trimmed
  }

  if (trimmed === "https://integrate.api.nvidia.com") {
    return `${trimmed}/v1/chat/completions`
  }

  return `${trimmed}/chat/completions`
}

function buildMessages(input: SciBiteInput) {
  const lengthGuidance = buildReadingLengthGuidance(input.length)
  const contract = {
    title: "string",
    sections: scibiteSectionKeys.map((key) => ({
      key,
      title: getSciBiteSectionTitle(input.language, key),
      content:
        key === "takeaways"
          ? Array.from({ length: lengthGuidance.takeawayCount }, () => "string")
          : "string",
    })),
  }

  return [
    {
      role: "system",
      content:
        "You are SciBite, an AI-powered science translator. Return exactly one valid JSON object. Do not wrap JSON in markdown. Do not add prose before or after the JSON. Keep claims grounded in the provided paper text.",
    },
    {
      role: "user",
      content: JSON.stringify({
        task:
          "Create a personalized paper explanation using the requested language, lens, and reading length.",
        requiredOutputContract: contract,
        rules: [
          "Use exactly these section keys: bite, problem, method, takeaways, analogy, matters, accuracy.",
          "Use the provided section titles.",
          "Follow the readingLengthGuidance exactly. Quick must be visibly shorter than Standard. Deep must be visibly more detailed than Standard.",
          `For takeaways, return exactly ${lengthGuidance.takeawayCount} strings.`,
          "For other sections, return paragraph strings sized according to readingLengthGuidance.",
          "Accuracy section must remind the user that SciBite simplifies the provided text and formal academic use requires checking the original paper.",
          "Game Style should use RPG quest, NPC, inventory, skill cooldown, or mission analogies.",
          "Daily Life Style should use grocery, bento, kitchen, or daily planning analogies.",
          "Executive Style should use workflow, delegation, risk control, or decision dashboard analogies.",
          "Pop Culture Style should use generic movie, series, or storytelling analogies without naming copyrighted works.",
        ],
        readingLengthGuidance: lengthGuidance,
        input,
      }),
    },
  ]
}

function buildReadingLengthGuidance(length: SciBiteInput["length"]) {
  if (length === "Quick Bite, 3 minutes") {
    return {
      targetSize:
        "Short result. Aim for roughly 300 to 450 words total before JSON escaping.",
      sectionDepth:
        "bite: exactly 1 sentence. problem, method, matters, and accuracy: 1 short paragraph with 1 to 2 sentences each. analogy: 2 to 3 sentences.",
      takeawayCount: 3,
      takeawayStyle:
        "Each takeaway should be one compact sentence focused on the highest-value idea.",
    }
  }

  if (length === "Deep Bite, 10 minutes") {
    return {
      targetSize:
        "Detailed result. Aim for roughly 950 to 1300 words total before JSON escaping.",
      sectionDepth:
        "bite: 2 sentences. problem, method, analogy, matters, and accuracy: 3 to 5 sentences each. Include mechanisms, assumptions, limitations, and practical implications when grounded in the input.",
      takeawayCount: 5,
      takeawayStyle:
        "Each takeaway should be specific and explanatory, not just a headline.",
    }
  }

  return {
    targetSize:
      "Medium result. Aim for roughly 600 to 850 words total before JSON escaping.",
    sectionDepth:
      "bite: 1 to 2 sentences. problem, method, analogy, matters, and accuracy: 2 to 3 sentences each.",
    takeawayCount: 4,
    takeawayStyle:
      "Each takeaway should include a short reason or implication.",
  }
}

function maxTokensForLength(length: SciBiteInput["length"]) {
  if (length === "Quick Bite, 3 minutes") {
    return 800
  }

  if (length === "Deep Bite, 10 minutes") {
    return 3400
  }

  return 2200
}

function normalizeModelResult(input: SciBiteInput, content: string) {
  const fallback = generateMockSciBite(input)
  const parsed = parseModelJson(content) as Partial<SciBiteResult>
  const parsedSections = Array.isArray(parsed.sections) ? parsed.sections : []

  const sections = scibiteSectionKeys.map((key) => {
    const section = parsedSections.find((item) => item?.key === key)
    const fallbackSection = fallback.sections.find((item) => item.key === key)!

    return {
      key,
      title: getSciBiteSectionTitle(input.language, key),
      content: normalizeSectionContent(key, section?.content, fallbackSection),
    } satisfies SciBiteSection
  })

  return {
    title:
      typeof parsed.title === "string" && parsed.title.trim()
        ? parsed.title.trim()
        : fallback.title,
    meta: fallback.meta,
    sections,
  } satisfies SciBiteResult
}

function normalizeSectionContent(
  key: SciBiteSectionKey,
  content: unknown,
  fallback: SciBiteSection
) {
  if (key === "takeaways") {
    if (Array.isArray(content)) {
      const items = content
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)

      if (items.length > 0) {
        return items.slice(0, 5)
      }
    }

    return fallback.content
  }

  if (typeof content === "string" && content.trim()) {
    return content.trim()
  }

  return fallback.content
}

function parseModelJson(content: string) {
  const json = extractJsonObject(content)

  try {
    return JSON.parse(json)
  } catch (error) {
    try {
      return JSON.parse(jsonrepair(json))
    } catch (repairError) {
      const strictMessage =
        error instanceof Error ? error.message : "Strict JSON parsing failed."
      const repairMessage =
        repairError instanceof Error ? repairError.message : "Repair failed."

      throw new Error(
        `NVIDIA response was not valid SciBite JSON: ${strictMessage} Repair also failed: ${repairMessage}`
      )
    }
  }
}

function extractJsonObject(content: string) {
  const trimmed = content.trim()
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
  const start = withoutFence.indexOf("{")

  if (start === -1) {
    throw new Error("No JSON object was found in the model response.")
  }

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < withoutFence.length; index += 1) {
    const char = withoutFence[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === "\"") {
        inString = false
      }

      continue
    }

    if (char === "\"") {
      inString = true
      continue
    }

    if (char === "{") {
      depth += 1
      continue
    }

    if (char === "}") {
      depth -= 1

      if (depth === 0) {
        return withoutFence.slice(start, index + 1)
      }
    }
  }

  throw new Error("The JSON object in the model response was incomplete.")
}

function windowlessSetTimeout(callback: () => void, ms: number) {
  return setTimeout(callback, ms)
}
