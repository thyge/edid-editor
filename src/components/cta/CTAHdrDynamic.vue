<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, HDRDynamicMetadataDataBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

/**
 * HDR Dynamic Metadata Data Block editor (tag 0x07 ext 0x07) — the HDR dynamic
 * section of the former combined "HDR & Colorimetry" view, split per block so
 * each block has its own nav placement.
 */
const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

const hdrDynamic = computed(() =>
  props.cea.dataBlocks.find(
    b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x07,
  ) as HDRDynamicMetadataDataBlock | undefined,
)

/** Resolve the block's `dataBlocks` index and emit a prop-rooted edit path. */
function emitBlock(field: string, value: unknown) {
  if (!hdrDynamic.value) return
  const idx = props.cea.dataBlocks.findIndex(b => b === hdrDynamic.value)
  if (idx !== -1) emit('update', `dataBlocks.${idx}.${field}`, value)
}

function updateEntry(index: number, field: 'type' | 'supportFlags', value: number) {
  if (!hdrDynamic.value) return
  const updated = hdrDynamic.value.entries.map((e, i) => (i === index ? { ...e, [field]: value } : e))
  emitBlock('entries', updated)
}

function removeEntry(index: number) {
  if (!hdrDynamic.value) return
  emitBlock('entries', hdrDynamic.value.entries.filter((_, i) => i !== index))
}

function addEntry() {
  if (!hdrDynamic.value) return
  emitBlock('entries', [...hdrDynamic.value.entries, { type: 0, supportFlags: 0, optionalFields: new Uint8Array() }])
}

const labelClass = 'flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex-1'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>HDR Dynamic Metadata</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3 text-sm">
      <p v-if="!hdrDynamic" class="text-muted-foreground">No HDR Dynamic Metadata block present.</p>
      <template v-else>
        <div v-if="hdrDynamic.entries.length > 0" class="space-y-2">
          <div
            v-for="(e, i) in hdrDynamic.entries"
            :key="i"
            class="rounded-md border border-border/40 px-3 py-2 space-y-2"
          >
            <div class="flex items-center gap-3">
              <label :class="labelClass">
                Type (16-bit)
                <Input type="number" :min="0" :max="65535" :step="1" :model-value="e.type" @update:model-value="(v) => updateEntry(i, 'type', Math.round(Number(v)) & 0xffff)" />
              </label>
              <label :class="labelClass">
                Support Flags (0–255)
                <Input type="number" :min="0" :max="255" :step="1" :model-value="e.supportFlags" @update:model-value="(v) => updateEntry(i, 'supportFlags', Math.round(Number(v)) & 0xff)" />
              </label>
              <Button variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 self-end" @click="removeEntry(i)">
                Remove
              </Button>
            </div>
            <p v-if="e.optionalFields.length > 0" class="text-[11px] text-muted-foreground/80">
              {{ e.optionalFields.length }} optional byte(s) preserved verbatim.
            </p>
          </div>
        </div>
        <Button v-else variant="outline" size="sm" disabled>No dynamic HDR types declared</Button>
        <div class="border-t pt-3">
          <Button variant="outline" size="sm" @click="addEntry">Add Type</Button>
        </div>
      </template>
    </CardContent>
  </Card>
</template>