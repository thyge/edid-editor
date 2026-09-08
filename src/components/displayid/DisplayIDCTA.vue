<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DisplayIdDataBlockTag,
  ExtensionBlockParser,
  type CEAExtensionBlock,
  type DisplayIdCtaBlock,
  type DisplayIdDataBlock,
  type DisplayIdSection,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { blocksByTag, bytesToHex, hexToBytes, stringFromEvent } from '../common/editorUtils'
import { isVendorBlock } from '../cta/vendorLabels'
import { ctaBlockNavLabel } from '../cta/ctaBlockOrder'
import CTAVideoBlock from '../cta/CTAVideoBlock.vue'
import CTAAudioBlock from '../cta/CTAAudioBlock.vue'
import CTASpeakerBlock from '../cta/CTASpeakerBlock.vue'
import CTAVesaTransferCharacteristic from '../cta/CTAVesaTransferCharacteristic.vue'
import CTAVendorChild from '../cta/CTAVendorChild.vue'
import CTAVideoCapability from '../cta/CTAVideoCapability.vue'
import CTAColorimetry from '../cta/CTAColorimetry.vue'
import CTAHdrStatic from '../cta/CTAHdrStatic.vue'
import CTAHdrDynamic from '../cta/CTAHdrDynamic.vue'
import CTAVideoFormatPreference from '../cta/CTAVideoFormatPreference.vue'
import CTAYCbCr420Video from '../cta/CTAYCbCr420Video.vue'
import CTAYCbCr420CapabilityMap from '../cta/CTAYCbCr420CapabilityMap.vue'
import CTARoomConfiguration from '../cta/CTARoomConfiguration.vue'
import CTASpeakerLocation from '../cta/CTASpeakerLocation.vue'
import CTAInfoFrame from '../cta/CTAInfoFrame.vue'

const props = defineProps<{ section: DisplayIdSection; index?: number }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

const ctaBlocks = computed(() =>
  blocksByTag<DisplayIdCtaBlock>(props.section, DisplayIdDataBlockTag.CtaDisplayId, props.index),
)

// --- Embedded-block selection (TASK-129) -------------------------------
// One embedded block of one 0x81 block is editable at a time, keyed
// "<blockIndex>:<dbIndex>" so multiple CTA blocks stay independent.
const selectedDbKey = ref<string | null>(null)

const selected = computed(() => {
  if (selectedDbKey.value === null) return null
  const [blockIndex, dbIndex] = selectedDbKey.value.split(':').map(Number)
  if (!Number.isInteger(blockIndex) || !Number.isInteger(dbIndex)) return null
  const block = ctaBlocks.value.find(entry => entry.index === blockIndex)?.block
  const db = block?.dataBlocks[dbIndex]
  return block && db ? { block, blockIndex, db, dbIndex } : null
})

function toggleSelect(blockIndex: number, dbIndex: number) {
  const key = `${blockIndex}:${dbIndex}`
  selectedDbKey.value = selectedDbKey.value === key ? null : key
}

/** Single-item (or empty) list for the selected embedded block of one 0x81
 *  block, so the editor template gets a structurally non-null entry instead
 *  of relying on computed null-narrowing across the v-if boundary. */
function selectedFor(blockIndex: number): { db: DisplayIdCtaBlock['dataBlocks'][number]; dbIndex: number }[] {
  if (selected.value?.blockIndex !== blockIndex) return []
  return [{ db: selected.value.db, dbIndex: selected.value.dbIndex }]
}

// --- Edit plumbing ------------------------------------------------------
// Encode rebuilds the CTA DisplayID payload from `dataBlocks` (+ `trailing`),
// so a hex edit must re-parse into those fields to take effect.
function setPayloadBytes(index: number, block: DisplayIdCtaBlock, raw: Uint8Array) {
  const { dataBlocks, trailing } = ExtensionBlockParser.decodeCtaDataBlockStream(raw)
  emit('updateBlock', index, { ...block, ctaPayload: raw, dataBlocks, trailing } as DisplayIdCtaBlock)
}

function setPayload(index: number, block: DisplayIdCtaBlock, hex: string) {
  setPayloadBytes(index, block, hexToBytes(hex))
}

/** Emit a model update with `ctaPayload` re-encoded so the hex view stays in
 *  sync with structured edits (the encode chain is byte-exact). */
function emitBlock(index: number, block: DisplayIdCtaBlock, dataBlocks: DisplayIdCtaBlock['dataBlocks'], trailing: Uint8Array) {
  const ctaPayload = ExtensionBlockParser.encodeCtaDataBlockStream(dataBlocks, trailing)
  emit('updateBlock', index, { ...block, dataBlocks, trailing, ctaPayload } as DisplayIdCtaBlock)
}

/** The structured CTA editors take a `cea: CEAExtensionBlock` prop and locate
 *  their block by searching `cea.dataBlocks`; a one-element scoped wrapper
 *  makes every one of them reusable against a single embedded block. */
function scoped(db: DisplayIdCtaBlock['dataBlocks'][number]): CEAExtensionBlock {
  return { dataBlocks: [db] } as unknown as CEAExtensionBlock
}

/** Apply an editor's prop-rooted path ("dataBlocks.0.<field>") to the target
 *  block in place — the section tree is reactive, the same convention as
 *  App.vue's setCeaField — then re-emit so ctaPayload follows. */
function applyScoped(index: number, block: DisplayIdCtaBlock, dbIndex: number, path: string, value: unknown) {
  const target = block.dataBlocks[dbIndex]
  if (!target) return
  const scopedObj: Record<string, unknown> = { dataBlocks: [target] }
  const parts = path.split('.')
  let cursor: Record<string, unknown> = scopedObj
  for (const part of parts.slice(0, -1)) cursor = cursor[part] as Record<string, unknown>
  cursor[parts[parts.length - 1]!] = value
  emitBlock(index, block, block.dataBlocks, block.trailing)
}

/** Wire bytes (header + payload) of one embedded block, for the raw-hex
 *  fallback editor. */
function blockWireBytes(db: DisplayIdCtaBlock['dataBlocks'][number]): Uint8Array {
  return ExtensionBlockParser.encodeCtaDataBlockStream([db])
}

/** Edit one embedded block as raw hex: splice the new bytes into the stream
 *  in place of the block's encoded bytes and re-parse the whole stream — the
 *  same path as the whole-payload editor, so malformed input lands in
 *  `trailing` instead of being dropped. */
function replaceDb(index: number, block: DisplayIdCtaBlock, dbIndex: number, hex: string) {
  const parts: Uint8Array[] = []
  block.dataBlocks.forEach((db, i) => {
    parts.push(i === dbIndex ? hexToBytes(hex) : blockWireBytes(db))
  })
  parts.push(block.trailing)
  let total = 0
  for (const part of parts) total += part.length
  const raw = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    raw.set(part, offset)
    offset += part.length
  }
  setPayloadBytes(index, block, raw)
}

function extTag(db: DisplayIdCtaBlock['dataBlocks'][number]): number | undefined {
  return (db as { extendedTag?: number }).extendedTag
}
</script>

<template>
  <Card>
    <CardHeader><CardTitle>CTA DisplayID</CardTitle></CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div v-for="{ block, index } in ctaBlocks" :key="index" class="space-y-3">
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">CTA Payload (hex — re-parses embedded short blocks)</label>
          <Input :model-value="bytesToHex(block.ctaPayload)" @input="setPayload(index, block, stringFromEvent($event))" />
        </div>

        <div v-if="block.dataBlocks.length > 0" class="space-y-1">
          <h4 class="text-xs font-medium text-muted-foreground">Embedded CTA short data blocks ({{ block.dataBlocks.length }}) — click a block to edit it</h4>
          <div class="space-y-1">
            <button
              v-for="(dataBlock, dbIndex) in block.dataBlocks"
              :key="dbIndex"
              type="button"
              class="flex w-full items-center justify-between gap-3 rounded-md border border-border px-3 py-1.5 text-left hover:bg-muted/50"
              :class="selectedDbKey === `${index}:${dbIndex}` ? 'border-ring bg-muted/50' : ''"
              @click="toggleSelect(index, dbIndex)"
            >
              <span class="text-xs">#{{ dbIndex }} — {{ ctaBlockNavLabel(dataBlock) }}</span>
              <span class="font-mono text-xs text-muted-foreground">{{ bytesToHex(dataBlock.payload) }}</span>
            </button>
          </div>
        </div>

        <!-- Structured editor for the selected embedded block. The per-tag
             chain mirrors App.vue's CTA per-block dispatch exactly, so an
             embedded block edits through the same UI as a top-level CEA
             block. -->
        <template v-for="sel in selectedFor(index)" :key="`${index}:${sel.dbIndex}`">
          <div class="space-y-4 rounded-md border border-border p-4">
            <CTAVideoBlock v-if="sel.db.tag === 0x02" :cea="scoped(sel.db)" @update="(path: string, value: unknown) => applyScoped(index, block, sel.dbIndex, path, value)" />
            <CTAAudioBlock v-else-if="sel.db.tag === 0x01" :cea="scoped(sel.db)" @update="(path: string, value: unknown) => applyScoped(index, block, sel.dbIndex, path, value)" />
            <CTASpeakerBlock v-else-if="sel.db.tag === 0x04" :cea="scoped(sel.db)" @update="(path: string, value: unknown) => applyScoped(index, block, sel.dbIndex, path, value)" />
            <CTAVesaTransferCharacteristic v-else-if="sel.db.tag === 0x05" :cea="scoped(sel.db)" @update="(path: string, value: unknown) => applyScoped(index, block, sel.dbIndex, path, value)" />
            <CTAVendorChild
              v-else-if="isVendorBlock(sel.db)"
              :cea="scoped(sel.db)"
              :index="0"
              @update="(path: string, value: unknown) => applyScoped(index, block, sel.dbIndex, path, value)"
            />
            <CTAVideoCapability v-else-if="extTag(sel.db) === 0x00" :cea="scoped(sel.db)" @update="(path: string, value: unknown) => applyScoped(index, block, sel.dbIndex, path, value)" />
            <CTAColorimetry v-else-if="extTag(sel.db) === 0x05" :cea="scoped(sel.db)" @update="(path: string, value: unknown) => applyScoped(index, block, sel.dbIndex, path, value)" />
            <CTAHdrStatic v-else-if="extTag(sel.db) === 0x06" :cea="scoped(sel.db)" @update="(path: string, value: unknown) => applyScoped(index, block, sel.dbIndex, path, value)" />
            <CTAHdrDynamic v-else-if="extTag(sel.db) === 0x07" :cea="scoped(sel.db)" @update="(path: string, value: unknown) => applyScoped(index, block, sel.dbIndex, path, value)" />
            <CTAVideoFormatPreference v-else-if="extTag(sel.db) === 0x0d" :cea="scoped(sel.db)" @update="(path: string, value: unknown) => applyScoped(index, block, sel.dbIndex, path, value)" />
            <CTAYCbCr420Video v-else-if="extTag(sel.db) === 0x0e" :cea="scoped(sel.db)" @update="(path: string, value: unknown) => applyScoped(index, block, sel.dbIndex, path, value)" />
            <CTAYCbCr420CapabilityMap v-else-if="extTag(sel.db) === 0x0f" :cea="scoped(sel.db)" @update="(path: string, value: unknown) => applyScoped(index, block, sel.dbIndex, path, value)" />
            <CTARoomConfiguration v-else-if="extTag(sel.db) === 0x13" :cea="scoped(sel.db)" @update="(path: string, value: unknown) => applyScoped(index, block, sel.dbIndex, path, value)" />
            <CTASpeakerLocation v-else-if="extTag(sel.db) === 0x14" :cea="scoped(sel.db)" @update="(path: string, value: unknown) => applyScoped(index, block, sel.dbIndex, path, value)" />
            <CTAInfoFrame v-else-if="extTag(sel.db) === 0x20" :cea="scoped(sel.db)" @update="(path: string, value: unknown) => applyScoped(index, block, sel.dbIndex, path, value)" />
            <!-- Blocks with no structured editor stay editable as raw hex of
                 their full wire bytes (header + payload). -->
            <div v-else class="space-y-1">
              <label class="text-xs text-muted-foreground">Block wire bytes (header + payload, hex — re-parses the embedded stream)</label>
              <Input :model-value="bytesToHex(blockWireBytes(sel.db))" @input="replaceDb(index, block, sel.dbIndex, stringFromEvent($event))" />
              <p class="text-xs text-muted-foreground">No structured editor for this block type; bytes the block parser cannot decode are preserved as trailing bytes.</p>
            </div>
          </div>
        </template>

        <div v-if="block.trailing.length > 0" class="space-y-1">
          <label class="text-xs text-muted-foreground">Unparsed trailing (malformed remainder)</label>
          <span class="font-mono text-xs text-muted-foreground">{{ bytesToHex(block.trailing) }}</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>