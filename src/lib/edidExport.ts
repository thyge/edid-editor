import { getProductName, type EEDID } from 'edidts'

/**
 * Format EDID bytes as uppercase hex, 16 space-separated bytes per line — the
 * classic EDID dump layout. The output round-trips through the hex-string
 * importer (which ignores whitespace).
 */
export function formatEdidHex(bytes: Uint8Array): string {
  const lines: string[] = []
  for (let i = 0; i < bytes.length; i += 16) {
    const row = Array.from(bytes.subarray(i, i + 16), (b) => b.toString(16).toUpperCase().padStart(2, '0'))
    lines.push(row.join(' '))
  }
  return lines.join('\n') + '\n'
}

/** Keep a name safe for a download: no path separators or reserved characters. */
function sanitizeFileName(name: string): string {
  return name
    .trim()
    .replace(/[\\/:*?"<>|\x00-\x1f]+/g, '')
    .replace(/\s+/g, '_')
    .replace(/^\.+/, '')
}

/**
 * Base file name (no extension) for a downloaded EDID. Prefers the name of
 * the file it was imported from so an edited file saves next to its source
 * under a familiar name; otherwise falls back to the monitor's product-name
 * descriptor, then the manufacturer ID + product code, then "edid".
 */
export function edidFileBaseName(edid: EEDID, sourceFileName?: string | null): string {
  if (sourceFileName) {
    const base = sanitizeFileName(sourceFileName.replace(/\.[^.]*$/, ''))
    if (base) return base
  }
  const productName = sanitizeFileName(getProductName(edid.base.displayDescriptors) ?? '')
  if (productName) return productName
  const { manufacturerId, productCode } = edid.base.header
  const fallback = sanitizeFileName(
    `${manufacturerId ?? ''}${productCode.toString(16).toUpperCase().padStart(4, '0')}`,
  )
  return fallback || 'edid'
}

/** Hand bytes or text to the browser as a file download. */
export function downloadFile(contents: Uint8Array | string, fileName: string, mimeType: string): void {
  const blob = new Blob([contents as BlobPart], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoke on the next tick so the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
