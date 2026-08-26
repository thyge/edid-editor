<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, InfoFrameDataBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { appendArrayItem, removeArrayItem, findExtendedDataBlockIndex } from '../common/editorUtils'

const props = defineProps<{ cea: CEAExtensionBlock }>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

type Descriptor = InfoFrameDataBlock['descriptors'][number]

const blockIndex = computed(() => findExtendedDataBlockIndex(props.cea, 0x20))
const block = computed(() =>
  props.cea.dataBlocks.find(
    b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x20
  ) as InfoFrameDataBlock | undefined
)

/** Emit a prop-rooted path `dataBlocks.<idx>.<field>` for the InfoFrame block. */
function emitField(field: string, value: unknown) {
  emit('update', `dataBlocks.${blockIndex.value}.${field}`, value)
}

function ouiHex(oui: number): string {
  return oui.toString(16).padStart(6, '0').toUpperCase().replace(/^(..)(..)(..)$/, '$1-$2-$3')
}
function hex(u: Uint8Array): string {
  return Array.from(u).map(b => b.toString(16).padStart(2, '0')).join(' ')
}
function onAdditionalVsifs(v: string | number) {
  if (!block.value) return
  const n = typeof v === 'number' ? v : Number(v)
  emitField('additionalVsifs', Number.isFinite(n) ? Math.max(0, Math.min(7, Math.round(n))) : 0)
}
function setDescriptors(descriptors: Descriptor[]) {
  emitField('descriptors', descriptors)
}
function removeDescriptor(index: number) {
  if (!block.value) return
  setDescriptors(removeArrayItem(block.value.descriptors, index))
}
function addShort() {
  if (!block.value) return
  setDescriptors(appendArrayItem(block.value.descriptors, { kind: 'short', infoFrameType: 0, payload: new Uint8Array() }))
}
function addVendor() {
  if (!block.value) return
  setDescriptors(appendArrayItem(block.value.descriptors, { kind: 'vendor', ieeeOui: 0, payload: new Uint8Array() }))
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>InfoFrame <span class="text-xs text-muted-foreground font-normal">(ext 0x20)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-3 text-sm">
      <p v-if="!block" class="text-muted-foreground">No InfoFrame Data Block present.</p>
      <template v-else>
        <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground max-w-xs">
          Additional VSIFs (0–7)
          <Input type="number" :min="0" :max="7" :step="1" :model-value="block.additionalVsifs" @update:model-value="(v) => onAdditionalVsifs(v)" />
        </label>

        <div v-if="block.descriptors.length > 0" class="space-y-2">
          <div
            v-for="(d, i) in block.descriptors"
            :key="i"
            class="rounded-md border border-border/40 px-3 py-2 space-y-2"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {{ d.kind === 'short' ? 'Short Descriptor' : 'Vendor Descriptor' }}
              </span>
              <Button variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2" @click="removeDescriptor(i)">Remove</Button>
            </div>
            <div v-if="d.kind === 'short'" class="grid grid-cols-2 gap-2">
              <span class="text-xs text-muted-foreground">InfoFrame Type: {{ d.infoFrameType }}</span>
              <span class="text-xs text-muted-foreground font-mono">payload: {{ hex(d.payload) }}</span>
            </div>
            <div v-else class="grid grid-cols-2 gap-2">
              <span class="text-xs text-muted-foreground">OUI: {{ ouiHex(d.ieeeOui) }}</span>
              <span class="text-xs text-muted-foreground font-mono">payload: {{ hex(d.payload) }}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="addShort">Add Short</Button>
          <Button variant="outline" size="sm" @click="addVendor">Add Vendor</Button>
        </div>
        <p class="text-xs text-muted-foreground/80">
          Descriptor payloads and the processing payload are displayed verbatim; editing the
          InfoFrame byte layout is left to a future task.
        </p>
      </template>
    </CardContent>
  </Card>
</template>