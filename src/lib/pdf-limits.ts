export const MAX_VERCEL_PDF_UPLOAD_BYTES = 4 * 1024 * 1024

export function formatFileSize(bytes: number) {
  const megabytes = bytes / (1024 * 1024)

  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`
}
