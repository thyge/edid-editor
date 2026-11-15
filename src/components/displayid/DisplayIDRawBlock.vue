<script setup lang="ts">
import { computed } from 'vue'
import {
  hasDisplayIdBlockCodec,
  isRawDisplayIdBlock,
  type DisplayIdDataBlock,
  type DisplayIdSection,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { bytesToHex, hexToBytes, stringFromEvent } from '../common/editorUtils'
import { displayIdBlockLabel } from './displayIdLabels'

/**
 * Fallback view for DisplayID data blocks without a structured editor:
 * unknown tags, v1.x tags without a typed editor, and the v2.0 tags whose
 * codecs exist but whose editors don't yet. Per-block nav entries exist for
 * every decoded block, so these need a view even when their bytes
 * can't be structured.
 *
 * Payload editability follows isRawDisplayIdBlock: a block that decoded to
 * structured fields re-encodes from them, so a raw payload edit would be
 * silently dropped — those render read-only. A raw carrier (unknown tag, or a
 * known tag whose payload did not decode) is written back from its payload,
 * so raw edits take effect.
 */
const props = defineProps<{
  section: DisplayIdSection
  /** Index of the block within section.blocks. */
  index: number
}>()

const emit = defineEmits<{ updateBlock: [index: number, block: DisplayIdDataBlock] }>()

const block = computed(() => props.section.blocks[props.index] as DisplayIdDataBlock | undefined)

const editable = computed(() => (block.value ? isRawDisplayIdBlock(block.value) : false))

function updatePayload(event: Event) {
  if (!block.value || !editable.value) return
  emit('updateBlock', props.index, { ...block.value, payload: hexToBytes(stringFromEvent(event)) })
}

const payloadLength = computed(() => block.value?.payload.length ?? 0)
</script>

<template>
  <Card v-if="block">
    <CardHeader>
      <CardTitle>{{ displayIdBlockLabel(block.tag) }}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3 text-sm">
      <p v-if="!editable" class="text-xs text-muted-foreground">
        This block type has a decoder but no structured editor yet; its payload is shown read-only
        because edits here would be dropped on re-encode (the payload is rebuilt from parsed fields).
      </p>
      <p v-else-if="hasDisplayIdBlockCodec(block.tag)" class="text-xs text-muted-foreground">
        This block's payload does not match its type's layout, so it could not be decoded into
        fields; its bytes are saved as shown here.
      </p>
      <p v-else class="text-xs text-muted-foreground">
        This block type has no structured editor; its bytes are preserved verbatim on round-trip.
      </p>
      <div class="grid grid-cols-4 gap-x-6 gap-y-2">
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Tag</label>
          <Input :model-value="`0x${block.tag.toString(16).padStart(2, '0').toUpperCase()}`" disabled />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Revision</label>
          <Input :model-value="block.revision" disabled />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Flags</label>
          <Input :model-value="block.flags" disabled />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground">Payload</label>
          <Input :model-value="`${payloadLength} byte${payloadLength === 1 ? '' : 's'}`" disabled />
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-xs text-muted-foreground">Payload (hex)</label>
        <Input
          :model-value="bytesToHex(block.payload)"
          :disabled="!editable"
          @input="updatePayload"
        />
      </div>
    </CardContent>
  </Card>
  <Card v-else>
    <CardContent class="text-sm text-muted-foreground">
      No data block at this position — it may have been removed or moved.
    </CardContent>
  </Card>
</template>