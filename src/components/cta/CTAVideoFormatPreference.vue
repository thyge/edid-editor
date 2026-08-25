<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, VideoFormatPreferenceDataBlock } from 'edidts'
import { getVICDefinition } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const props = defineProps<{ cea: CEAExtensionBlock }>()

const emit = defineEmits<{
  update: [block: VideoFormatPreferenceDataBlock | undefined, field: string, value: unknown]
}>()

const block = computed(() =>
  props.cea.dataBlocks.find(
    b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x0D
  ) as VideoFormatPreferenceDataBlock | undefined
)

function setSvrs(svrs: VideoFormatPreferenceDataBlock['svrs']) {
  emit('update', block.value, 'svrs', svrs)
}
function updateSvr(index: number, kind: 'vic' | 'dtd', raw: number) {
  if (!block.value) return
  // SVR < 128 is a VIC; SVR >= 129 is a DTD index (SVR - 128). 128 is reserved.
  const svr = kind === 'vic' ? Math.max(0, Math.min(127, Math.round(raw))) : 128 + Math.max(1, Math.round(raw))
  const updated = block.value.svrs.map((s, i) => {
    if (i !== index) return s
    return kind === 'vic' ? { vic: svr } : { dtdIndex: svr - 128 }
  })
  setSvrs(updated)
}
function removeSvr(index: number) {
  if (!block.value) return
  setSvrs(block.value.svrs.filter((_, i) => i !== index))
}
function addSvr(kind: 'vic' | 'dtd') {
  if (!block.value) return
  setSvrs([...block.value.svrs, kind === 'vic' ? { vic: 1 } : { dtdIndex: 1 }])
}
function entryKind(s: VideoFormatPreferenceDataBlock['svrs'][number]): 'vic' | 'dtd' {
  return s.vic !== undefined ? 'vic' : 'dtd'
}
function entryValue(s: VideoFormatPreferenceDataBlock['svrs'][number]): number {
  return s.vic !== undefined ? s.vic : (s.dtdIndex ?? 0)
}
function vicLabel(vic: number): string {
  const def = getVICDefinition(vic)
  return def ? `${def.width}×${def.height}${def.interlaced ? 'i' : 'p'} @ ${def.refreshRate}Hz` : 'unknown/reserved'
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Video Format Preference <span class="text-xs text-muted-foreground font-normal">(ext 0x0D)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-3 text-sm">
      <p v-if="!block" class="text-muted-foreground">No Video Format Preference Data Block present.</p>
      <template v-else>
        <p class="text-xs text-muted-foreground">Ordered preference list. SVR &lt; 128 = VIC; SVR ≥ 129 = DTD index (SVR − 128).</p>
        <div v-if="block.svrs.length > 0" class="space-y-2">
          <div
            v-for="(s, i) in block.svrs"
            :key="i"
            class="flex items-end gap-2 rounded-md border border-border/40 px-3 py-2"
          >
            <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Type
              <select
                class="flex h-8 rounded-md border border-input bg-transparent dark:bg-input/30 px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                :value="entryKind(s)"
                @change="(e: Event) => updateSvr(i, (e.target as HTMLSelectElement).value as 'vic' | 'dtd', entryValue(s))"
              >
                <option value="vic">VIC (1–127)</option>
                <option value="dtd">DTD Index (≥1)</option>
              </select>
            </label>
            <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex-1">
              Value
              <Input
                type="number"
                :min="entryKind(s) === 'vic' ? 1 : 1"
                :step="1"
                :model-value="entryValue(s)"
                @update:model-value="(v) => updateSvr(i, entryKind(s), Number(v))"
              />
            </label>
            <span class="text-xs text-muted-foreground/80 pb-2 truncate">
              {{ entryKind(s) === 'vic' ? vicLabel(entryValue(s)) : `DTD #${entryValue(s)}` }}
            </span>
            <Button variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2" @click="removeSvr(i)">
              Remove
            </Button>
          </div>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="addSvr('vic')">Add VIC</Button>
          <Button variant="outline" size="sm" @click="addSvr('dtd')">Add DTD</Button>
        </div>
      </template>
    </CardContent>
  </Card>
</template>