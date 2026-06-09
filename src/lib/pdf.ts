import { readFileSync } from "node:fs"
import { join } from "node:path"

export const MAX_PDF_BYTES = 24 * 1024 * 1024
export const MAX_EXTRACTED_CHARS = 28000
export const PDF_PAGES_TO_PARSE = 8

const PDF_WORKER_PATH = join(
  process.cwd(),
  "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs"
)

let isPdfWorkerConfigured = false
let pdfWorkerDataUrl: string | null = null

export type ExtractedPdfText = {
  text: string
  pageCount: number
}

export async function extractPdfTextFromBuffer(
  data: Uint8Array
): Promise<ExtractedPdfText> {
  ensurePdfDomMatrix()

  const { PDFParse } = await import("pdf-parse")

  await configurePdfWorker(PDFParse)

  const parser = new PDFParse({ data })

  try {
    const result = await parser.getText({ first: PDF_PAGES_TO_PARSE })

    return {
      text: result.text,
      pageCount: result.total,
    }
  } finally {
    await parser.destroy()
  }
}

function configurePdfWorker(PDFParse: typeof import("pdf-parse").PDFParse) {
  if (isPdfWorkerConfigured) {
    return
  }

  PDFParse.setWorker(getPdfWorkerDataUrl())
  isPdfWorkerConfigured = true
}

function getPdfWorkerDataUrl() {
  if (pdfWorkerDataUrl) {
    return pdfWorkerDataUrl
  }

  const worker = readFileSync(PDF_WORKER_PATH)
  pdfWorkerDataUrl = `data:text/javascript;base64,${worker.toString("base64")}`

  return pdfWorkerDataUrl
}

function ensurePdfDomMatrix() {
  const pdfGlobal = globalThis as unknown as Record<string, unknown>

  if (!pdfGlobal.DOMMatrix) {
    pdfGlobal.DOMMatrix = SimpleDOMMatrix
  }
}

type Matrix2DSource = {
  a?: number
  b?: number
  c?: number
  d?: number
  e?: number
  f?: number
  m11?: number
  m12?: number
  m21?: number
  m22?: number
  m41?: number
  m42?: number
}

type Matrix2DArray = ArrayLike<number>
type Matrix2DInit = Matrix2DSource | Matrix2DArray

class SimpleDOMMatrix {
  a = 1
  b = 0
  c = 0
  d = 1
  e = 0
  f = 0
  is2D = true

  constructor(init?: Matrix2DInit) {
    if (isMatrixArray(init)) {
      if (init.length === 6) {
        this.a = init[0]
        this.b = init[1]
        this.c = init[2]
        this.d = init[3]
        this.e = init[4]
        this.f = init[5]
      } else if (init.length >= 16) {
        this.a = init[0]
        this.b = init[1]
        this.c = init[4]
        this.d = init[5]
        this.e = init[12]
        this.f = init[13]
      }

      return
    }

    if (init) {
      this.a = init.a ?? init.m11 ?? this.a
      this.b = init.b ?? init.m12 ?? this.b
      this.c = init.c ?? init.m21 ?? this.c
      this.d = init.d ?? init.m22 ?? this.d
      this.e = init.e ?? init.m41 ?? this.e
      this.f = init.f ?? init.m42 ?? this.f
    }
  }

  get m11() {
    return this.a
  }

  set m11(value: number) {
    this.a = value
  }

  get m12() {
    return this.b
  }

  set m12(value: number) {
    this.b = value
  }

  get m21() {
    return this.c
  }

  set m21(value: number) {
    this.c = value
  }

  get m22() {
    return this.d
  }

  set m22(value: number) {
    this.d = value
  }

  get m41() {
    return this.e
  }

  set m41(value: number) {
    this.e = value
  }

  get m42() {
    return this.f
  }

  set m42(value: number) {
    this.f = value
  }

  get isIdentity() {
    return (
      this.a === 1 &&
      this.b === 0 &&
      this.c === 0 &&
      this.d === 1 &&
      this.e === 0 &&
      this.f === 0
    )
  }

  translate(tx = 0, ty = 0) {
    return this.clone().translateSelf(tx, ty)
  }

  translateSelf(tx = 0, ty = 0) {
    this.e += this.a * tx + this.c * ty
    this.f += this.b * tx + this.d * ty

    return this
  }

  scale(scaleX = 1, scaleY = scaleX) {
    return this.clone().scaleSelf(scaleX, scaleY)
  }

  scaleSelf(scaleX = 1, scaleY = scaleX) {
    this.a *= scaleX
    this.b *= scaleX
    this.c *= scaleY
    this.d *= scaleY

    return this
  }

  multiplySelf(other: Matrix2DInit) {
    return this.applyMultiply(other, false)
  }

  preMultiplySelf(other: Matrix2DInit) {
    return this.applyMultiply(other, true)
  }

  invertSelf() {
    const determinant = this.a * this.d - this.b * this.c

    if (determinant === 0) {
      this.a = this.b = this.c = this.d = this.e = this.f = Number.NaN
      return this
    }

    const a = this.d / determinant
    const b = -this.b / determinant
    const c = -this.c / determinant
    const d = this.a / determinant
    const e = (this.c * this.f - this.d * this.e) / determinant
    const f = (this.b * this.e - this.a * this.f) / determinant

    this.a = a
    this.b = b
    this.c = c
    this.d = d
    this.e = e
    this.f = f

    return this
  }

  inverse() {
    return this.clone().invertSelf()
  }

  private clone() {
    return new SimpleDOMMatrix(this)
  }

  private applyMultiply(
    other: Matrix2DInit,
    preMultiply: boolean
  ) {
    const left = preMultiply ? new SimpleDOMMatrix(other) : this
    const right = preMultiply ? this : new SimpleDOMMatrix(other)

    const a = left.a * right.a + left.c * right.b
    const b = left.b * right.a + left.d * right.b
    const c = left.a * right.c + left.c * right.d
    const d = left.b * right.c + left.d * right.d
    const e = left.a * right.e + left.c * right.f + left.e
    const f = left.b * right.e + left.d * right.f + left.f

    this.a = a
    this.b = b
    this.c = c
    this.d = d
    this.e = e
    this.f = f

    return this
  }
}

function isMatrixArray(value: Matrix2DInit | undefined): value is Matrix2DArray {
  return Boolean(value) && (Array.isArray(value) || ArrayBuffer.isView(value))
}
