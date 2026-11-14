<script setup lang="ts">
import { computed } from 'vue'
import {
  DISPLAY_ID_PAYLOAD_CAPACITY_BYTES,
  getDisplayIdFreePayloadBytes,
  type DisplayIdChainEntry,
} from 'edidts'
import { Button } from '@/components/ui/button'
import { bytesToHex, displayIdSectionWireLength } from '../common/editorUtils'

/**
 * Section-chain summary for the EDID's DisplayID: one row per section with
 * the EDID extension block that carries it, its live wire length and a
 * remove affordance for extension sections. Each 0x70 block's non-zero bytes
 * after its sections (read-only, kept verbatim on save) are listed with it.
 * Rows route to the section's overview via the shared section ids.
 */
const props = defineProps<{
  chain: DisplayIdChainEntry[]
  /** Chain index of the section whose overview is rendered (for row highlight). */
  activeSectionIndex: number
}>()

const emit = defineEmits<{
  addSection: []
  removeSection: [sectionIndex: number]
  select: [sectionId: string]
}>()

/** DisplayID 2.x chains sections via the base section's extension count.
 *  A new section gets a 0x70 block of its own, so adding one never runs out
 *  of room; it is offered for v2.x chains only. */
const canAddSection = computed(() => (props.chain[0]?.section.versionByte ?? 0) >= 0x20)

interface ChainRow {
  sectionIndex: number
  label: string
  blockLabel: string
  blockCount: number
  bytes: number
  /** Set on the last section of each 0x70 block: that block's budget. */
  blockSummary?: { free: number; trailingHex: string }
}

const rows = computed<ChainRow[]>(() => props.chain.map((entry, sectionIndex) => {
  const next = props.chain[sectionIndex + 1]
  const lastInBlock = !next || next.extensionIndex !== entry.extensionIndex
  return {
    sectionIndex,
    label: sectionIndex === 0 ? 'Base Section' : `Section ${sectionIndex + 1}`,
    // Block 0 is the base EDID block, so extension i is EDID block i + 1.
    blockLabel: `EDID block ${entry.extensionIndex + 1}`,
    blockCount: entry.section.blocks.length,
    bytes: displayIdSectionWireLength(entry),
    blockSummary: lastInBlock
      ? { free: getDisplayIdFreePayloadBytes(entry.extension), trailingHex: nonZeroTrailingHex(entry.extension.trailingBytes) }
      : undefined,
  }
}))

/** Trailing bytes up to the last non-zero one; zero padding is free space, not data. */
function nonZeroTrailingHex(bytes: Uint8Array | undefined): string {
  if (!bytes) return ''
  let end = bytes.length
  while (end > 0 && bytes[end - 1] === 0) end--
  return bytesToHex(bytes.subarray(0, end))
}

function selectSection(sectionIndex: number) {
  emit('select', `displayid-s${sectionIndex}-overview`)
}
</script>

<template>
  <section>
    <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Section Chain</h4>
    <div class="space-y-2">
      <template v-for="row in rows" :key="row.sectionIndex">
        <div
          class="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
          :class="{ 'border-primary/50': row.sectionIndex === activeSectionIndex }"
        >
          <button
            type="button"
            class="flex-1 text-left"
            :title="`View ${row.label}`"
            @click="selectSection(row.sectionIndex)"
          >
            <span class="font-medium">{{ row.label }}</span>
            <span class="ml-2 text-xs text-muted-foreground">
              {{ row.blockLabel }}
              · {{ row.blockCount }} block{{ row.blockCount === 1 ? '' : 's' }}
              · {{ row.bytes }} bytes
            </span>
          </button>
          <Button
            v-if="row.sectionIndex > 0"
            variant="ghost"
            size="sm"
            class="text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
            :title="`Remove ${row.label}`"
            @click="emit('removeSection', row.sectionIndex)"
          >
            Remove
          </Button>
        </div>
        <div v-if="row.blockSummary" class="space-y-1 px-3">
          <p class="text-xs" :class="row.blockSummary.free < 0 ? 'text-destructive' : 'text-muted-foreground'">
            {{ row.blockLabel }}:
            <template v-if="row.blockSummary.free >= 0">
              {{ row.blockSummary.free }} of {{ DISPLAY_ID_PAYLOAD_CAPACITY_BYTES }} bytes free
            </template>
            <template v-else>
              {{ -row.blockSummary.free }} bytes over the {{ DISPLAY_ID_PAYLOAD_CAPACITY_BYTES }}-byte limit
            </template>
          </p>
          <template v-if="row.blockSummary.trailingHex">
            <p class="text-xs text-muted-foreground">
              Bytes after the section (kept as-is on save):
            </p>
            <p class="break-all font-mono text-xs">{{ row.blockSummary.trailingHex }}</p>
          </template>
        </div>
      </template>
      <Button
        v-if="canAddSection"
        variant="outline"
        size="sm"
        class="w-full text-xs"
        title="Adds an extension section in a new DisplayID extension block"
        @click="emit('addSection')"
      >
        + Add Section
      </Button>
    </div>
  </section>
</template>
