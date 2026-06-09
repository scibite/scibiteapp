export async function readApiResponse<T>(
  response: Response,
  fallbackMessage: string
) {
  const text = await response.text()

  if (!text.trim()) {
    return {} as T
  }

  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error(`${fallbackMessage} The server returned invalid JSON.`)
    }
  }

  throw new Error(buildNonJsonError(response, text, fallbackMessage))
}

function buildNonJsonError(
  response: Response,
  text: string,
  fallbackMessage: string
) {
  const status = response.status
    ? `${response.status}${response.statusText ? ` ${response.statusText}` : ""}`
    : "a non-JSON response"
  const details = stripHtml(text).slice(0, 220)

  if (!details) {
    return `${fallbackMessage} The server returned ${status}.`
  }

  return `${fallbackMessage} The server returned ${status}: ${details}`
}

function stripHtml(text: string) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}
