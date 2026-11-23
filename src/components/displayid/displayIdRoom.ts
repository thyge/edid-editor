import { computed, inject, provide, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import { DISPLAY_ID_PAYLOAD_CAPACITY_BYTES } from 'edidts'

/**
 * Free payload bytes of the 0x70 block that carries the DisplayID section
 * being edited. App provides it; block editors use it to disable controls
 * that would grow a block past what the block can hold (encoding refuses
 * content that does not fit rather than cutting it off).
 */
const DISPLAY_ID_FREE_BYTES: InjectionKey<Ref<number>> = Symbol('displayIdFreeBytes')

export function provideDisplayIdFreeBytes(freeBytes: Ref<number>): void {
  provide(DISPLAY_ID_FREE_BYTES, freeBytes)
}

export interface DisplayIdRoom {
  /** Free payload bytes in this section's 0x70 block (Infinity when unknown). */
  freeBytes: ComputedRef<number>
  /** True when `bytes` more payload bytes still fit. */
  fits: (bytes: number) => boolean
  /** Hover hint for a control disabled because `bytes` more would not fit. */
  noRoomTitle: (bytes: number) => string
}

export function useDisplayIdRoom(): DisplayIdRoom {
  const injected = inject(DISPLAY_ID_FREE_BYTES, null)
  const freeBytes = computed(() => injected?.value ?? Number.POSITIVE_INFINITY)
  return {
    freeBytes,
    fits: (bytes) => bytes <= freeBytes.value,
    noRoomTitle: (bytes) =>
      `Needs ${bytes} more byte${bytes === 1 ? '' : 's'}; only ${Math.max(0, freeBytes.value)} of `
      + `${DISPLAY_ID_PAYLOAD_CAPACITY_BYTES} free in this DisplayID block — remove a block or entry first`,
  }
}
