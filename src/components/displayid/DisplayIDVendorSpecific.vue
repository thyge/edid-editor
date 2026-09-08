<script setup lang="ts">
import { computed } from 'vue'
import {
  DISPLAY_ID_V1_BLOCK_TAGS,
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdExtension,
  type DisplayIdV1VendorSpecificBlock,
  type DisplayIdVendorSpecificBlock,
  type DisplayIdVesaDisplayPortData,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { blocksByTag, bytesToHex, hexToBytes, numberFromEvent, stringFromEvent, type IndexedBlock } from '../common/editorUtils'
import DisplayIDVendorVesaDisplayPort from './DisplayIDVendorVesaDisplayPort.vue'

const props = defineProps<{ displayId: DisplayIdExtension; index?: number }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

/**
 * The vendor-specific block(s) to edit, across both tag spaces: v2.0 (tag 0x7e)
 * and DisplayID 1.x (tag 0x7f). When the per-block `index` prop is set (the
 * displayid-block-<idx> sections from TASK-123) the editor scopes to exactly
 * that block; otherwise it falls back to every vendor block in the section.
 *
 * `VendorBlock` is the template-facing shape: each arm of the v2.0/v1.x union
 * carries only its own extras (`vesaDisplayPort` is v2.0-only, `vendorPayload`
 * is v1.x-only), so the template reads them as optional fields and the v-if
 * arms are the runtime discriminants.
 */
interface VendorBlock extends DisplayIdDataBlock {
  ieeeOui?: number
  vesaDisplayPort?: DisplayIdVesaDisplayPortData
  vendorPayload?: Uint8Array
}

const vendorBlocks = computed<IndexedBlock<VendorBlock>[]>(() => {
  if (props.index !== undefined) {
    const block = props.displayId.section.blocks[props.index] as VendorBlock | undefined
    if (!block || (block.tag !== DisplayIdDataBlockTag.VendorSpecific && block.tag !== DISPLAY_ID_V1_BLOCK_TAGS.VendorSpecific)) {
      return []
    }
    return [{ block, index: props.index }]
  }
  return [
    ...blocksByTag<VendorBlock>(props.displayId, DisplayIdDataBlockTag.VendorSpecific),
    ...blocksByTag<VendorBlock>(props.displayId, DISPLAY_ID_V1_BLOCK_TAGS.VendorSpecific),
  ]
})

// Unknown/raw fallback: patch a top-level field (OUI, v2.0 payload, or the v1.x
// vendorPayload). Used for any OUI without a registered vendor codec, mirroring
// CEAVendorUnknown. The v1.x codec (encodeV1VendorSpecificBlock) re-encodes
// from ieeeOui + vendorPayload, so v1.x edits must patch those — patching
// `payload` would be silently dropped on re-encode.
// `tag` is omitted from each side before intersecting — the two blocks carry
// disjoint tag unit types, and TS would collapse the intersection to `never`.
type VendorPatch = Partial<Omit<DisplayIdVendorSpecificBlock, 'tag'>> & Partial<Omit<DisplayIdV1VendorSpecificBlock, 'tag'>>

function update(index: number, block: VendorBlock, patch: VendorPatch) {
  emit('updateBlock', index, { ...block, ...patch })
}

// VESA DisplayPort (OUI 0x3a0292): patch a field of the decoded
// `vesaDisplayPort` shape. encodeVendorSpecificBlock rebuilds the payload from
// the structured fields + OUI, so the computed re-encodes on the next render.
// Only reached for v2.0 blocks — the v1.x codec has no vendor registry.
function updateVesa(index: number, block: VendorBlock, field: string, value: unknown) {
  const vesaPatch = { [field]: value } as Partial<DisplayIdVesaDisplayPortData>
  const updated: DisplayIdVendorSpecificBlock = {
    ...(block as DisplayIdVendorSpecificBlock),
    vesaDisplayPort: { ...block.vesaDisplayPort!, ...vesaPatch },
  }
  emit('updateBlock', index, updated)
}

/** OUI as the spec's dash-separated triple (bytes MSB-first, e.g. 00-10-FA).
 *  Real-world blocks sometimes store it byte-reversed (an Apple panel EDID
 *  carries FA-10-00), so the hex form makes the stored order visible. */
function ouiTriple(oui: number | undefined): string {
  const v = (oui ?? 0) >>> 0
  return [v >>> 16, (v >>> 8) & 0xff, v & 0xff]
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join('-')
}
</script>

<template>
  <Card>
    <CardHeader><CardTitle>Vendor-specific</CardTitle></CardHeader>
    <CardContent class="space-y-4 text-sm">
      <p v-if="vendorBlocks.length === 0" class="text-muted-foreground">
        No vendor-specific block at this position — it may have been removed or moved.
      </p>
      <div v-for="{ block, index } in vendorBlocks" :key="index">
        <!-- VESA DisplayPort (OUI 0x3a0292) — structured editor (v2.0 only) -->
        <DisplayIDVendorVesaDisplayPort
          v-if="block.vesaDisplayPort"
          :fields="block.vesaDisplayPort"
          @update="(f: string, v: unknown) => updateVesa(index, block, f, v)"
        />
        <!-- DisplayID 1.x (tag 0x7f) — OUI + raw vendor body; the codec
             re-encodes from ieeeOui + vendorPayload. -->
        <div v-else-if="block.vendorPayload !== undefined" class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">IEEE OUI</label>
            <Input type="number" min="0" max="16777215" :model-value="block.ieeeOui ?? 0" @input="update(index, block, { ieeeOui: numberFromEvent($event) })" />
            <p class="text-xs text-muted-foreground">{{ ouiTriple(block.ieeeOui) }}</p>
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Vendor Payload</label>
            <Input :model-value="bytesToHex(block.vendorPayload)" @input="update(index, block, { vendorPayload: hexToBytes(stringFromEvent($event)) })" />
          </div>
        </div>
        <!-- v2.0 unknown OUI — raw OUI + hex-payload editor (fallback) -->
        <div v-else class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">IEEE OUI</label>
            <Input type="number" min="0" max="16777215" :model-value="block.ieeeOui ?? 0" @input="update(index, block, { ieeeOui: numberFromEvent($event) })" />
            <p class="text-xs text-muted-foreground">{{ ouiTriple(block.ieeeOui) }}</p>
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Payload</label>
            <Input :model-value="bytesToHex(block.payload)" @input="update(index, block, { payload: hexToBytes(stringFromEvent($event)) })" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>