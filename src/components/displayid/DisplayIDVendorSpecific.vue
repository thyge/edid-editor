<script setup lang="ts">
import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdExtension,
  type DisplayIdVendorSpecificBlock,
  type DisplayIdVesaDisplayPortData,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { blocksByTag, bytesToHex, hexToBytes, numberFromEvent, stringFromEvent } from '../common/editorUtils'
import DisplayIDVendorVesaDisplayPort from './DisplayIDVendorVesaDisplayPort.vue'

const props = defineProps<{ displayId: DisplayIdExtension }>()
const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

// Unknown/raw fallback: patch a top-level field (OUI or raw payload). Used for
// any OUI without a registered vendor codec, mirroring CEAVendorUnknown.
function update(index: number, block: DisplayIdVendorSpecificBlock, patch: Partial<DisplayIdVendorSpecificBlock>) {
  emit('updateBlock', index, { ...block, ...patch })
}

// VESA DisplayPort (OUI 0x3a0292): patch a field of the decoded
// `vesaDisplayPort` shape. encodeVendorSpecificBlock rebuilds the payload from
// the structured fields + OUI, so the computed re-encodes on the next render.
function updateVesa(index: number, block: DisplayIdVendorSpecificBlock, field: string, value: unknown) {
  const vesaPatch = { [field]: value } as Partial<DisplayIdVesaDisplayPortData>
  const updated: DisplayIdVendorSpecificBlock = {
    ...block,
    vesaDisplayPort: { ...block.vesaDisplayPort!, ...vesaPatch },
  }
  emit('updateBlock', index, updated)
}
</script>

<template>
  <Card>
    <CardHeader><CardTitle>Vendor-specific</CardTitle></CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div v-for="{ block, index } in blocksByTag<DisplayIdVendorSpecificBlock>(props.displayId, DisplayIdDataBlockTag.VendorSpecific)" :key="index">
        <!-- VESA DisplayPort (OUI 0x3a0292) — structured editor -->
        <DisplayIDVendorVesaDisplayPort
          v-if="block.vesaDisplayPort"
          :fields="block.vesaDisplayPort"
          @update="(f: string, v: unknown) => updateVesa(index, block, f, v)"
        />
        <!-- Unknown OUI — raw OUI + hex-payload editor (fallback) -->
        <div v-else class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">IEEE OUI</label>
            <Input type="number" min="0" max="16777215" :model-value="block.ieeeOui ?? 0" @input="update(index, block, { ieeeOui: numberFromEvent($event) })" />
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