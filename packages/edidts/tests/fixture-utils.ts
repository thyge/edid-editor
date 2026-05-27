export function hexToUint8Array(hex: string): Uint8Array {
  const cleaned = hex.replace(/[^0-9a-f]/gi, '')
  const bytes = new Uint8Array(Math.floor(cleaned.length / 2))

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(cleaned.slice(index * 2, index * 2 + 2), 16)
  }

  return bytes
}
