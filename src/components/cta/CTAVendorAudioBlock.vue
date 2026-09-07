<script setup lang="ts">
import type { VendorSpecificAudioDataBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ouiLabel } from './vendorLabels'

/**
 * Per-block editor for one Vendor-Specific Audio Data Block (tag 0x07 ext
 * 0x11). The block's position in the CEA dataBlocks array is passed in so the
 * edit path is index-rooted (dataBlocks.<index>.vendorPayload) — multiple
 * vendor-audio blocks each get their own editor (TASK-102). The post-OUI
 * payload is edited as raw bytes; the 3-byte OUI is fixed at decode time.
 */
const props = defineProps<{
  block: VendorSpecificAudioDataBlock
  /** Index of this block within cea.dataBlocks (edit-path root). */
  index: number
}>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

function payloadHex(): string {
  return Array.from(props.block.vendorPayload).map(b => b.toString(16).padStart(2, '0')).join(' ')
}

function onPayload(text: string) {
  const bytes = text.trim().split(/\s+/).map(s => parseInt(s, 16) & 0xff).filter(n => !Number.isNaN(n))
  emit('update', `dataBlocks.${props.index}.vendorPayload`, new Uint8Array(bytes))
}

const rowClass = 'flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Vendor-Specific Audio <span class="text-xs text-muted-foreground font-normal">(ext 0x11 · OUI {{ ouiLabel(block.ieeeOui) }})</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-3 text-sm">
      <div class="grid grid-cols-2 gap-x-6 gap-y-2">
        <label :class="rowClass">
          IEEE OUI
          <Input :model-value="ouiLabel(block.ieeeOui)" readonly />
        </label>
        <label :class="rowClass">
          Payload length
          <Input :model-value="block.vendorPayload.length" readonly />
        </label>
      </div>
      <label :class="rowClass">
        Payload (hex bytes, space-separated)
        <Input
          class="font-mono"
          :model-value="payloadHex()"
          @update:model-value="(v: string | number) => onPayload(String(v))"
        />
      </label>
      <p class="text-xs text-muted-foreground/80">
        The post-OUI payload is edited as raw bytes; the 3-byte OUI is fixed at decode time.
      </p>
    </CardContent>
  </Card>
</template>