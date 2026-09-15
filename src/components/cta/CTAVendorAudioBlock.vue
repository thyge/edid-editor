<script setup lang="ts">
import { computed } from 'vue'
import type { DolbyVSADB, VendorSpecificAudioDataBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ouiLabel } from './vendorLabels'

/**
 * Per-block editor for one Vendor-Specific Audio Data Block (tag 0x07 ext
 * 0x11). The block's position in the CEA dataBlocks array is passed in so the
 * edit path is index-rooted (dataBlocks.<index>.…) — multiple vendor-audio
 * blocks each get their own editor.
 *
 * A VSADB with a registered codec (Dolby Atmos, kind 'dolbyVsadb') is edited
 * through its structured `vendor.fields` — the encoder re-encodes from those
 * fields, so raw `vendorPayload` hex edits would be silently ignored. An
 * unregistered OUI keeps the legacy raw editor: the post-OUI payload as
 * space-separated hex, with the 3-byte OUI fixed at decode time.
 */
const props = defineProps<{
  block: VendorSpecificAudioDataBlock
  /** Index of this block within cea.dataBlocks (edit-path root). */
  index: number
}>()

const emit = defineEmits<{
  update: [path: string, value: unknown]
}>()

/** Structured Dolby Atmos fields, present when the Dolby codec decoded them. */
const dolby = computed<DolbyVSADB | null>(() =>
  props.block.vendor?.kind === 'dolbyVsadb' ? (props.block.vendor.fields as DolbyVSADB) : null,
)

function emitField(field: string, value: unknown) {
  emit('update', `dataBlocks.${props.index}.vendor.fields.${field}`, value)
}

function onVersion(v: string | number) {
  const parsed = typeof v === 'number' ? v : Number(v)
  // Version is encoded as version − 1 in bits 2:0 of byte 0, so 1–8.
  emitField('version', Number.isFinite(parsed) ? Math.max(1, Math.min(8, Math.round(parsed))) : 1)
}

function payloadHex(): string {
  return Array.from(props.block.vendorPayload).map(b => b.toString(16).padStart(2, '0')).join(' ')
}

function onPayload(text: string) {
  const bytes = text.trim().split(/\s+/).map(s => parseInt(s, 16) & 0xff).filter(n => !Number.isNaN(n))
  emit('update', `dataBlocks.${props.index}.vendorPayload`, new Uint8Array(bytes))
}

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
const rowClassSmall = 'flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground'
</script>

<template>
  <Card v-if="dolby">
    <CardHeader>
      <CardTitle>Dolby Atmos VSADB <span class="text-xs text-muted-foreground font-normal">(ext 0x11 · OUI {{ ouiLabel(block.ieeeOui) }})</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-1 text-sm">
      <label :class="rowClassSmall">
        Version (1–8)
        <Input type="number" :min="1" :max="8" :step="1" :model-value="dolby.version" @update:model-value="(v) => onVersion(v)" />
      </label>
      <div :class="rowClass">
        <span>Headphone playback only</span>
        <Switch :model-value="dolby.headphoneOnly" @update:model-value="(v: boolean) => emitField('headphoneOnly', v)" />
      </div>
      <div :class="rowClass">
        <span>Height speaker zone</span>
        <Switch :model-value="dolby.heightZone" @update:model-value="(v: boolean) => emitField('heightZone', v)" />
      </div>
      <div :class="rowClass">
        <span>Surround speaker zone</span>
        <Switch :model-value="dolby.surroundZone" @update:model-value="(v: boolean) => emitField('surroundZone', v)" />
      </div>
      <div :class="rowClass">
        <span>Center speaker zone</span>
        <Switch :model-value="dolby.centerZone" @update:model-value="(v: boolean) => emitField('centerZone', v)" />
      </div>
      <div :class="rowClass">
        <span>MAT decoding at 48 kHz only (no TrueHD)</span>
        <Switch :model-value="dolby.mat48kHzOnly" @update:model-value="(v: boolean) => emitField('mat48kHzOnly', v)" />
      </div>
      <p class="text-xs text-muted-foreground/80">
        Zone flags and version per the Dolby VSADB layout (edid-decode cta_dolby_audio()); vendor-reserved trailing bytes are preserved verbatim.
      </p>
    </CardContent>
  </Card>

  <Card v-else>
    <CardHeader>
      <CardTitle>Vendor-Specific Audio <span class="text-xs text-muted-foreground font-normal">(ext 0x11 · OUI {{ ouiLabel(block.ieeeOui) }})</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-3 text-sm">
      <div class="grid grid-cols-2 gap-x-6 gap-y-2">
        <label :class="rowClassSmall">
          IEEE OUI
          <Input :model-value="ouiLabel(block.ieeeOui)" readonly />
        </label>
        <label :class="rowClassSmall">
          Payload length
          <Input :model-value="block.vendorPayload.length" readonly />
        </label>
      </div>
      <label :class="rowClassSmall">
        Payload (hex bytes, space-separated)
        <Input
          class="font-mono"
          :model-value="payloadHex()"
          @update:model-value="(v: string | number) => onPayload(String(v))"
        />
      </label>
      <p class="text-xs text-muted-foreground/80">
        The post-OUI payload is edited as raw bytes; the 3-byte OUI is fixed at decode time.
      </p>
    </CardContent>
  </Card>
</template>