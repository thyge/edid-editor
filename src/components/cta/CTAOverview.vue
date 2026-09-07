<script setup lang="ts">
import { computed } from 'vue'
import { computeRefreshRate, type CEAExtensionBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [field: string, value: unknown]
  /** Native-DTD selection change (TASK-103): the reordered detailedTimings
   *  array (selected DTDs moved to the leading prefix) plus the derived
   *  byte-3 bits 3:0 count. Handled in App.vue with an array-level
   *  reassignment (like add/remove timing), not a setByPath write. */
  reorderNative: [timings: CEAExtensionBlock['detailedTimings'], nativeCount: number]
}>()

// The CTA encoder recomputes dtdOffset from the live data-block layout and the
// DTD count is just detailedTimings.length (see ExtensionBlockParser.encodeCEA),
// so neither is surfaced here — the overview shows only what the user edits or
// can compare against the Header & Flags page.

/** Width of byte 3 bits 3:0 — at most 15 DTDs can be declared native. */
const MAX_NATIVE = 15

/**
 * Decoded-state initialization: per CTA-861-G the first N DTDs are native, so
 * the selection is the leading prefix of length N. A malformed count beyond
 * the list length degrades gracefully to "all native" (effective prefix).
 */
const nativeCount = computed(() => Math.min(props.cea.nativeFormats, props.cea.detailedTimings.length))

function timingLabel(timing: CEAExtensionBlock['detailedTimings'][number]): string {
  const refresh = computeRefreshRate(timing)
  return `${timing.horizontalActive}×${timing.verticalActive}${timing.flags.interlaced ? 'i' : 'p'} @ ${refresh.toFixed(2)} Hz`
}

/**
 * Toggle one DTD in or out of the native set. The spec only allows the native
 * DTDs to be a leading prefix, so the change reorders the array: the toggled
 * DTD moves to the group boundary (end of the native group when checked, head
 * of the non-native group when unchecked) and every other DTD keeps its
 * relative order. nativeFormats is derived from the new prefix length. The
 * reorder also changes the implied preference order (first DTD = preferred)
 * — visible in the numbered picker labels.
 */
function onToggleNative(checked: boolean | 'indeterminate', index: number) {
  const isChecked = checked === true
  const n = nativeCount.value
  // Ignore no-ops and the beyond-cap check case (its checkbox is disabled).
  if (isChecked ? index < n || n >= MAX_NATIVE : index >= n) return
  const list = [...props.cea.detailedTimings]
  const [moved] = list.splice(index, 1)
  list.splice(isChecked ? n : n - 1, 0, moved)
  emit('reorderNative', list, isChecked ? n + 1 : n - 1)
}

const switchRowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>CTA-861 Extension Overview</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Header</h4>
        <div class="grid grid-cols-2 gap-x-6 gap-y-2">
          <div :class="switchRowClass">
            <span class="text-muted-foreground">Revision</span>
            <span class="font-mono">{{ cea.revision }}</span>
          </div>
          <div :class="switchRowClass">
            <span class="text-muted-foreground">Native DTDs</span>
            <span class="font-mono">{{ nativeCount }} / {{ cea.detailedTimings.length }}</span>
          </div>
        </div>
      </section>

      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Native Formats (Byte 3 Bits 3:0)</h4>
        <p class="text-xs text-muted-foreground mb-3">
          The first N detailed timings are native formats; the rest are supported but not native. Selecting a DTD
          moves it into the native group (and to the front of the list, since the first DTD is also the preferred
          timing); up to {{ MAX_NATIVE }} can be declared.
        </p>
        <ul v-if="cea.detailedTimings.length > 0" class="space-y-1.5">
          <li v-for="(timing, i) in cea.detailedTimings" :key="i" class="flex items-center gap-2.5">
            <Checkbox
              :model-value="i < nativeCount"
              :disabled="i >= nativeCount && nativeCount >= MAX_NATIVE"
              :aria-label="`DTD ${i + 1} native`"
              @update:model-value="(v: boolean | 'indeterminate') => onToggleNative(v, i)"
            />
            <span :class="i < nativeCount ? 'text-foreground' : 'text-muted-foreground'">
              DTD {{ i + 1 }} · {{ timingLabel(timing) }}
            </span>
          </li>
        </ul>
        <p v-else class="text-xs text-muted-foreground">
          No detailed timing descriptors in this extension — add timings to declare native formats.
        </p>
      </section>

      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Capabilities</h4>
        <div class="grid grid-cols-2 gap-x-6 gap-y-1">
          <div :class="switchRowClass">
            <span>Underscan</span>
            <span :class="cea.underscan ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ cea.underscan ? 'Supported' : 'Not supported' }}
            </span>
          </div>
          <div :class="switchRowClass">
            <span>Basic Audio</span>
            <span :class="cea.basicAudio ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ cea.basicAudio ? 'Supported' : 'Not supported' }}
            </span>
          </div>
          <div :class="switchRowClass">
            <span>YCbCr 4:4:4</span>
            <span :class="cea.ycbcr444 ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ cea.ycbcr444 ? 'Supported' : 'Not supported' }}
            </span>
          </div>
          <div :class="switchRowClass">
            <span>YCbCr 4:2:2</span>
            <span :class="cea.ycbcr422 ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ cea.ycbcr422 ? 'Supported' : 'Not supported' }}
            </span>
          </div>
        </div>
      </section>
    </CardContent>
  </Card>
</template>