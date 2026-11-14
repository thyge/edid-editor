<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, VideoFormatPreferenceDataBlock, VideoFormatPreferenceSvr } from 'edidts'
import { getVICDefinition } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { findExtendedDataBlockIndex } from '../common/editorUtils'
import { ctaAddBlockedReason } from './blockCapacity'

const props = defineProps<{ cea: CEAExtensionBlock }>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

const blockIndex = computed(() => findExtendedDataBlockIndex(props.cea, 0x0D))
const block = computed(() =>
  props.cea.dataBlocks.find(
    b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x0D
  ) as VideoFormatPreferenceDataBlock | undefined
)

/** Each SVR is one byte; null when one more fits in the block and the extension. */
const addBlockedReason = computed(() => ctaAddBlockedReason(props.cea, block.value, 1))

/**
 * SVR kinds, per edid-decode `cta_print_svr`: the value ranges each kind can
 * hold (the byte is the value plus the kind's offset).
 */
type SvrKind = 'vic' | 'dtd' | 'vtdb' | 'rid' | 't8vtdb' | 'reserved'
const KINDS: ReadonlyArray<{ kind: SvrKind; label: string; min: number; max: number }> = [
  { kind: 'vic', label: 'VIC (1–127, 193–253)', min: 1, max: 253 },
  { kind: 'dtd', label: 'DTD index (1–16)', min: 1, max: 16 },
  { kind: 'vtdb', label: 'DisplayID timing (1–16)', min: 1, max: 16 },
  { kind: 'rid', label: 'RID frame rate (1–15)', min: 1, max: 15 },
  { kind: 't8vtdb', label: 'T8VTDB timing', min: 0, max: 0 },
  { kind: 'reserved', label: 'Reserved value', min: 0, max: 255 },
]
const kindInfo = (kind: SvrKind) => KINDS.find(k => k.kind === kind)!

function setSvrs(svrs: VideoFormatPreferenceDataBlock['svrs']) {
  emit('update', `dataBlocks.${blockIndex.value}.svrs`, svrs)
}

function entryKind(s: VideoFormatPreferenceSvr): SvrKind {
  if (s.vic !== undefined) return 'vic'
  if (s.dtdIndex !== undefined) return 'dtd'
  if (s.vtdbIndex !== undefined) return 'vtdb'
  if (s.ridRateIndex !== undefined) return 'rid'
  if (s.t8vtdb) return 't8vtdb'
  return 'reserved'
}
function entryValue(s: VideoFormatPreferenceSvr): number {
  return s.vic ?? s.dtdIndex ?? s.vtdbIndex ?? s.ridRateIndex ?? s.reserved ?? 0
}

/** Build an SVR of `kind`, keeping the value inside that kind's range. */
function makeSvr(kind: SvrKind, raw: number): VideoFormatPreferenceSvr {
  const { min, max } = kindInfo(kind)
  let value = Number.isFinite(raw) ? Math.max(min, Math.min(max, Math.round(raw))) : min
  switch (kind) {
    case 'vic':
      // SVRs 128–192 are not VICs; snap to the nearer valid VIC.
      if (value >= 128 && value <= 192) value = value <= 160 ? 127 : 193
      return { vic: value }
    case 'dtd': return { dtdIndex: value }
    case 'vtdb': return { vtdbIndex: value }
    case 'rid': return { ridRateIndex: value }
    case 't8vtdb': return { t8vtdb: true }
    default: return { reserved: value }
  }
}

function updateSvr(index: number, kind: SvrKind, raw: number) {
  if (!block.value) return
  setSvrs(block.value.svrs.map((s, i) => (i === index ? makeSvr(kind, raw) : s)))
}
function removeSvr(index: number) {
  if (!block.value) return
  setSvrs(block.value.svrs.filter((_, i) => i !== index))
}
function addSvr(kind: 'vic' | 'dtd') {
  if (!block.value || addBlockedReason.value) return
  setSvrs([...block.value.svrs, makeSvr(kind, 1)])
}
function describe(s: VideoFormatPreferenceSvr): string {
  switch (entryKind(s)) {
    case 'vic': {
      const def = getVICDefinition(s.vic!)
      return def ? `${def.width}×${def.height}${def.interlaced ? 'i' : 'p'} @ ${def.refreshRate}Hz` : 'unknown VIC'
    }
    case 'dtd': return `DTD #${s.dtdIndex}`
    case 'vtdb': return `DisplayID Type VII/VIII/X timing #${s.vtdbIndex}`
    case 'rid': return `First VFDB RID, frame-rate index ${s.ridRateIndex}`
    case 't8vtdb': return 'Type VIII (DMT) timing'
    default: return 'reserved — ignored by sinks'
  }
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
        <p class="text-xs text-muted-foreground">
          Ordered preference list of Short Video References: VICs (1–127, 193–253), DTDs (129–144),
          DisplayID timings (145–160), RIDs (161–175) or the T8VTDB timing (254).
        </p>
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
                @change="(e: Event) => updateSvr(i, (e.target as HTMLSelectElement).value as SvrKind, entryValue(s))"
              >
                <option v-for="k in KINDS" :key="k.kind" :value="k.kind">{{ k.label }}</option>
              </select>
            </label>
            <label
              v-if="entryKind(s) !== 't8vtdb'"
              class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex-1"
            >
              Value
              <Input
                type="number"
                :min="kindInfo(entryKind(s)).min"
                :max="kindInfo(entryKind(s)).max"
                :step="1"
                :model-value="entryValue(s)"
                @update:model-value="(v) => updateSvr(i, entryKind(s), Number(v))"
              />
            </label>
            <span class="text-xs text-muted-foreground/80 pb-2 truncate">{{ describe(s) }}</span>
            <Button variant="ghost" size="sm" class="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2" @click="removeSvr(i)">
              Remove
            </Button>
          </div>
        </div>
        <div class="flex gap-2" :title="addBlockedReason ?? undefined">
          <Button variant="outline" size="sm" :disabled="addBlockedReason !== null" @click="addSvr('vic')">Add VIC</Button>
          <Button variant="outline" size="sm" :disabled="addBlockedReason !== null" @click="addSvr('dtd')">Add DTD</Button>
        </div>
        <p v-if="addBlockedReason" class="text-xs text-muted-foreground">{{ addBlockedReason }}</p>
      </template>
    </CardContent>
  </Card>
</template>
