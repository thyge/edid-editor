<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const props = defineProps<{
  cea: CEAExtensionBlock
}>()

// The CTA encoder recomputes dtdOffset from the live data-block layout and the
// DTD count is just detailedTimings.length (see ExtensionBlockParser.encodeCEA),
// so neither is surfaced here — the overview shows only what the user edits or
// can compare against the Header & Flags page.

/**
 * Read-only effective native count: per CTA-861-G the first N DTDs are native.
 * A malformed count beyond the list length degrades gracefully to "all native".
 * The interactive picker lives in CTAHeaderFlags.
 */
const nativeCount = computed(() => Math.min(props.cea.nativeFormats, props.cea.detailedTimings.length))

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