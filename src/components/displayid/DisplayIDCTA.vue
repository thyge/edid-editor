<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  ExtensionBlockParser,
  getCEADataBlockLabel,
  type DisplayIdCtaBlock,
  type DisplayIdDataBlock,
  type DisplayIdExtension,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { blocksByTag, bytesToHex, hexToBytes, stringFromEvent } from './displayIdEditorUtils'

const props = defineProps<{ displayId: DisplayIdExtension }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

// Encode rebuilds the CTA DisplayID payload from `dataBlocks` (+ `trailing`),
// so a hex edit must re-parse into those fields to take effect.
function setPayload(index: number, block: DisplayIdCtaBlock, hex: string) {
  const raw = hexToBytes(hex)
  const { dataBlocks, trailing } = ExtensionBlockParser.decodeCtaDataBlockStream(raw)
  emit('updateBlock', index, { ...block, ctaPayload: raw, dataBlocks, trailing } as DisplayIdCtaBlock)
}

// Embedded CTA short data-block tag labels reuse the CTA-861 label map
// (cta/extension-block.ts) via getCEADataBlockLabel — the tag space is shared.
</script>

<template>
  <Card>
    <CardHeader><CardTitle>CTA DisplayID</CardTitle></CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div v-for="{ block, index } in blocksByTag<DisplayIdCtaBlock>(props.displayId, DisplayIdDataBlockTag.CtaDisplayId)" :key="index" class="space-y-3">
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">CTA Payload (hex — re-parses embedded short blocks)</label>
          <Input :model-value="bytesToHex(block.ctaPayload)" @input="setPayload(index, block, stringFromEvent($event))" />
        </div>
        <div v-if="block.dataBlocks.length > 0" class="space-y-1">
          <h4 class="text-xs font-medium text-muted-foreground">Embedded CTA short data blocks ({{ block.dataBlocks.length }})</h4>
          <div v-for="(dataBlock, dbIndex) in block.dataBlocks" :key="dbIndex" class="flex items-center justify-between rounded-md border border-border px-3 py-1.5">
            <span class="text-xs">Tag 0x{{ dataBlock.tag.toString(16).padStart(2, '0') }} — {{ getCEADataBlockLabel(dataBlock.tag) }}</span>
            <span class="font-mono text-xs text-muted-foreground">{{ bytesToHex(dataBlock.payload) }}</span>
          </div>
        </div>
        <div v-if="block.trailing.length > 0" class="space-y-1">
          <label class="text-xs text-muted-foreground">Unparsed trailing (malformed remainder)</label>
          <span class="font-mono text-xs text-muted-foreground">{{ bytesToHex(block.trailing) }}</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>