<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, VendorSpecificAudioDataBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const props = defineProps<{ cea: CEAExtensionBlock }>()

const emit = defineEmits<{
  update: [block: VendorSpecificAudioDataBlock | undefined, field: string, value: unknown]
}>()

const block = computed(() =>
  props.cea.dataBlocks.find(
    b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x11
  ) as VendorSpecificAudioDataBlock | undefined
)

function ouiHex(oui: number): string {
  return oui.toString(16).padStart(6, '0').toUpperCase().replace(/^(..)(..)(..)$/, '$1-$2-$3')
}
function payloadHex(): string {
  if (!block.value) return ''
  return Array.from(block.value.vendorPayload).map(b => b.toString(16).padStart(2, '0')).join(' ')
}
function onPayload(text: string) {
  if (!block.value) return
  const bytes = text.trim().split(/\s+/).map(s => parseInt(s, 16) & 0xff).filter(n => !Number.isNaN(n))
  emit('update', block.value, 'vendorPayload', new Uint8Array(bytes))
}
const rowClass = 'flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Vendor-Specific Audio <span class="text-xs text-muted-foreground font-normal">(ext 0x11)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-3 text-sm">
      <p v-if="!block" class="text-muted-foreground">No Vendor-Specific Audio Data Block present.</p>
      <template v-else>
        <div class="grid grid-cols-2 gap-x-6 gap-y-2">
          <label :class="rowClass">
            IEEE OUI
            <Input :model-value="ouiHex(block.ieeeOui)" readonly />
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
      </template>
    </CardContent>
  </Card>
</template>