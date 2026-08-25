import type { DisplayIdDataBlock, DisplayIdExtension } from 'edidts'

export interface IndexedBlock<T extends DisplayIdDataBlock> {
  index: number
  block: T
}

export function blocksByTag<T extends DisplayIdDataBlock>(
  displayId: DisplayIdExtension,
  tag: number,
): IndexedBlock<T>[] {
  return displayId.section.blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => block.tag === tag) as IndexedBlock<T>[]
}

export function updateArrayItem<T>(items: T[], index: number, item: T): T[] {
  const next = [...items]
  next[index] = item
  return next
}

export function removeArrayItem<T>(items: T[], index: number): T[] {
  return items.filter((_, itemIndex) => itemIndex !== index)
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
    .join(' ')
}

export function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/[^0-9a-fA-F]/g, '')
  const values: number[] = []
  for (let index = 0; index + 1 < cleaned.length; index += 2) {
    values.push(parseInt(cleaned.slice(index, index + 2), 16))
  }
  return new Uint8Array(values)
}

export function numberFromEvent(event: Event): number {
  const value = Number((event.target as HTMLInputElement).value)
  return Number.isFinite(value) ? value : 0
}

export function stringFromEvent(event: Event): string {
  return (event.target as HTMLInputElement).value
}
