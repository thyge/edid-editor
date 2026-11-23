<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, SpeakerLocationDataBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { findExtendedDataBlockIndex } from '../common/editorUtils'
import { ctaAddBlockedReason } from './blockCapacity'

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

/** A descriptor without coordinates is 2 bytes; switching coordinates on adds 3. */
const addBlockedReason = computed(() => ctaAddBlockedReason(props.cea, block.value, 2))
const coordBlockedReason = computed(() => ctaAddBlockedReason(props.cea, block.value, 3))

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
  if (!block.value || addBlockedReason.value) return
  setDescriptors([...block.value.descriptors, { channelIndex: 0, speakerId: 0, active: false }])
}
function toggleCoordinates(index: number, on: boolean) {
  if (on && coordBlockedReason.value) return
  updateEntry(index, { coordinates: on ? { x: 0, y: 0, z: 0 } : undefined })
}
function num(v: string | number, min: number, max: number): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : min
}
/** Coordinates are signed 1.6 fixed point (CTA-861-G Table 94): −2 … +1.984 in steps of 1/64. */
function coord(v: string | number): number {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(-128, Math.min(127, Math.round(n * 64))) / 64
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
          Speaker IDs per CTA-861-G Table 34; coordinates are optional (COORD flag) and are fractions of the
          room size (Xmax/Ymax/Zmax) from the Room Configuration block.
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
                <Input type="number" :min="0" :max="31" :step="1" :model-value="d.channelIndex" @update:model-value="(v) => updateEntry(i, { channelIndex: num(v, 0, 31) })" />
              </label>
              <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex-1">
                Speaker ID (0–31)
                <Input type="number" :min="0" :max="31" :step="1" :model-value="d.speakerId" @update:model-value="(v) => updateEntry(i, { speakerId: num(v, 0, 31) })" />
              </label>
              <label class="flex items-center gap-2 text-xs pb-2">
                <span class="text-muted-foreground">Active</span>
                <Switch :model-value="d.active" @update:model-value="(v: boolean) => updateEntry(i, { active: v })" />
              </label>
              <label class="flex items-center gap-2 text-xs pb-2" :title="!d.coordinates && coordBlockedReason ? coordBlockedReason : undefined">
                <span class="text-muted-foreground">Coordinates</span>
                <Switch
                  :model-value="d.coordinates !== undefined"
                  :disabled="!d.coordinates && coordBlockedReason !== null"
                  @update:model-value="(v: boolean) => toggleCoordinates(i, v)"
                />
              </label>
              <Button variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2" @click="removeEntry(i)">Remove</Button>
            </div>
            <div v-if="d.coordinates" class="grid grid-cols-3 gap-2">
              <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                X (× Xmax)
                <Input type="number" :min="-2" :max="1.984375" :step="0.015625" :model-value="d.coordinates.x" @update:model-value="(v) => updateEntry(i, { coordinates: { ...d.coordinates!, x: coord(v) } })" />
              </label>
              <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Y (× Ymax)
                <Input type="number" :min="-2" :max="1.984375" :step="0.015625" :model-value="d.coordinates.y" @update:model-value="(v) => updateEntry(i, { coordinates: { ...d.coordinates!, y: coord(v) } })" />
              </label>
              <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Z (× Zmax)
                <Input type="number" :min="-2" :max="1.984375" :step="0.015625" :model-value="d.coordinates.z" @update:model-value="(v) => updateEntry(i, { coordinates: { ...d.coordinates!, z: coord(v) } })" />
              </label>
            </div>
          </div>
        </div>
        <div :title="addBlockedReason ?? undefined" class="inline-block">
          <Button variant="outline" size="sm" :disabled="addBlockedReason !== null" @click="addEntry">Add Speaker</Button>
        </div>
        <p v-if="addBlockedReason" class="text-xs text-muted-foreground">{{ addBlockedReason }}</p>
      </template>
    </CardContent>
  </Card>
</template>
