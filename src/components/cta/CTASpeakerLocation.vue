<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, SpeakerLocationDataBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { findExtendedDataBlockIndex } from '../common/editorUtils'

const props = defineProps<{ cea: CEAExtensionBlock }>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

type Descriptor = SpeakerLocationDataBlock['descriptors'][number]

const blockIndex = computed(() => findExtendedDataBlockIndex(props.cea, 0x14))
const block = computed(() =>
  props.cea.dataBlocks.find(
    b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x14
  ) as SpeakerLocationDataBlock | undefined
)

function setDescriptors(descriptors: Descriptor[]) {
  emit('update', `dataBlocks.${blockIndex.value}.descriptors`, descriptors)
}
function updateEntry(index: number, patch: Partial<Descriptor>) {
  if (!block.value) return
  setDescriptors(block.value.descriptors.map((d, i) => (i === index ? { ...d, ...patch } : d)))
}
function removeEntry(index: number) {
  if (!block.value) return
  setDescriptors(block.value.descriptors.filter((_, i) => i !== index))
}
function addEntry() {
  if (!block.value) return
  setDescriptors([...block.value.descriptors, { channelIndex: 0, speakerId: 0, active: false }])
}
function num(v: string | number): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.round(n) : 0
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Speaker Location <span class="text-xs text-muted-foreground font-normal">(ext 0x14)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-3 text-sm">
      <p v-if="!block" class="text-muted-foreground">No Speaker Location Data Block present.</p>
      <template v-else>
        <p class="text-xs text-muted-foreground">
          Simplified per CTA-861-G Table 34; coordinates are optional (COORD flag).
        </p>
        <div v-if="block.descriptors.length > 0" class="space-y-2">
          <div
            v-for="(d, i) in block.descriptors"
            :key="i"
            class="rounded-md border border-border/40 px-3 py-2 space-y-2"
          >
            <div class="flex items-end gap-2">
              <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex-1">
                Channel Index (0–31)
                <Input type="number" :min="0" :max="31" :step="1" :model-value="d.channelIndex" @update:model-value="(v) => updateEntry(i, { channelIndex: Math.max(0, Math.min(31, num(v))) })" />
              </label>
              <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex-1">
                Speaker ID (0–31)
                <Input type="number" :min="0" :max="31" :step="1" :model-value="d.speakerId" @update:model-value="(v) => updateEntry(i, { speakerId: Math.max(0, Math.min(31, num(v))) })" />
              </label>
              <label class="flex items-center gap-2 text-xs pb-2">
                <span class="text-muted-foreground">Active</span>
                <Switch :model-value="d.active" @update:model-value="(v: boolean) => updateEntry(i, { active: v })" />
              </label>
              <Button variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2" @click="removeEntry(i)">Remove</Button>
            </div>
            <div v-if="d.coordinates" class="grid grid-cols-3 gap-2">
              <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                X (mm)
                <Input type="number" :step="1" :model-value="d.coordinates.x" @update:model-value="(v) => updateEntry(i, { coordinates: { ...d.coordinates!, x: num(v) } })" />
              </label>
              <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Y (mm)
                <Input type="number" :step="1" :model-value="d.coordinates.y" @update:model-value="(v) => updateEntry(i, { coordinates: { ...d.coordinates!, y: num(v) } })" />
              </label>
              <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Z (mm)
                <Input type="number" :step="1" :model-value="d.coordinates.z" @update:model-value="(v) => updateEntry(i, { coordinates: { ...d.coordinates!, z: num(v) } })" />
              </label>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" @click="addEntry">Add Speaker</Button>
      </template>
    </CardContent>
  </Card>
</template>