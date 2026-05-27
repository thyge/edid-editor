import { readonly, ref } from 'vue'

export interface EdidSlot {
  index: number
  label: string | null
  data: string | null
  updatedAt: string | null
}

const DEFAULT_SLOT_COUNT = 3
const COOKIE_KEY = 'edidSlots.v1'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180 // six months
const COOKIE_MAX_BYTES = 4096
const SLOT_ESTIMATED_BYTES = 384
const MAX_SLOT_COUNT = Math.max(1, Math.floor(COOKIE_MAX_BYTES / SLOT_ESTIMATED_BYTES))

const slots = ref<EdidSlot[]>(createEmptySlots(DEFAULT_SLOT_COUNT))

function createEmptySlot(index: number): EdidSlot {
  return {
    index,
    label: null,
    data: null,
    updatedAt: null,
  }
}

function createEmptySlots(count: number) {
  const safeCount = Math.min(Math.max(count, 1), MAX_SLOT_COUNT)
  return Array.from({ length: safeCount }, (_, index) => createEmptySlot(index))
}

function readCookie(key: string) {
  if (typeof document === 'undefined') {
    return null
  }

  const raw = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${key}=`))

  if (!raw) {
    return null
  }

  return raw.slice(raw.indexOf('=') + 1)
}

function persistSlots() {
  if (typeof document === 'undefined') {
    return
  }

  const payload = slots.value.map(({ label, data, updatedAt }) => ({
    label,
    data,
    updatedAt,
  }))

  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(payload))};path=/;max-age=${COOKIE_MAX_AGE}`
}

function hydrateSlots() {
  const stored = readCookie(COOKIE_KEY)
  if (!stored) {
    return
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(stored)) as Array<{
      label: string | null
      data: string | null
      updatedAt: string | null
    }>

    if (!Array.isArray(parsed) || parsed.length === 0) {
      slots.value = createEmptySlots(DEFAULT_SLOT_COUNT)
    } else {
      slots.value = parsed.slice(0, MAX_SLOT_COUNT).map((entry, index) => ({
        index,
        label: entry?.label ?? null,
        data: entry?.data ?? null,
        updatedAt: entry?.updatedAt ?? null,
      }))
    }
  } catch (error) {
    console.warn('[useEdidSlots] Failed to parse slot cookie', error)
    slots.value = createEmptySlots(DEFAULT_SLOT_COUNT)
    persistSlots()
  }
}

hydrateSlots()

function normalizeIndex(index: number) {
  if (slots.value.length === 0) {
    slots.value = createEmptySlots(DEFAULT_SLOT_COUNT)
  }

  const maxIndex = Math.max(slots.value.length - 1, 0)
  if (Number.isNaN(index)) {
    return 0
  }

  return Math.min(Math.max(index, 0), maxIndex)
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function base64ToBytes(base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function saveSlot(index: number, bytes: Uint8Array, label?: string | null) {
  const normalized = normalizeIndex(index)
  slots.value[normalized] = {
    index: normalized,
    label: label?.trim() || `Slot ${normalized + 1}`,
    data: bytesToBase64(bytes),
    updatedAt: new Date().toISOString(),
  }
  slots.value = [...slots.value]
  persistSlots()
}

function loadSlot(index: number) {
  const normalized = normalizeIndex(index)
  const slot = slots.value[normalized]
  if (!slot || !slot.data) {
    return null
  }

  try {
    return base64ToBytes(slot.data)
  } catch (error) {
    console.warn('[useEdidSlots] Failed to decode slot payload', error)
    return null
  }
}

function clearSlot(index: number) {
  const normalized = normalizeIndex(index)
  slots.value[normalized] = {
    index: normalized,
    label: null,
    data: null,
    updatedAt: null,
  }
  slots.value = [...slots.value]
  persistSlots()
}

function addSlot() {
  if (slots.value.length >= MAX_SLOT_COUNT) {
    return slots.value.length - 1
  }

  const nextSlot = createEmptySlot(slots.value.length)
  slots.value = [...slots.value, nextSlot]
  persistSlots()
  return nextSlot.index
}

function removeSlot(index: number) {
  if (slots.value.length <= 1) {
    slots.value = createEmptySlots(1)
    persistSlots()
    return
  }

  const normalized = normalizeIndex(index)
  const next = slots.value.filter((_, slotIndex) => slotIndex !== normalized)
  slots.value = next.map((slot, slotIndex) => ({
    ...slot,
    index: slotIndex,
  }))
  persistSlots()
}

function moveSlot(fromIndex: number, toIndex: number) {
  if (slots.value.length < 2) {
    return
  }

  const from = normalizeIndex(fromIndex)
  const target = Math.min(Math.max(toIndex, 0), slots.value.length - 1)
  if (from === target) {
    return
  }

  const next = [...slots.value]
  const [moved] = next.splice(from, 1)
  if (!moved) {
    return
  }
  next.splice(target, 0, moved)
  slots.value = next.map((slot, slotIndex) => ({
    ...slot,
    index: slotIndex,
  }))
  persistSlots()
}

export function useEdidSlots() {
  return {
    slots: readonly(slots),
    saveSlot,
    loadSlot,
    clearSlot,
    addSlot,
    removeSlot,
    moveSlot,
  }
}
