<script setup lang="ts">
import { computed } from 'vue'
import type { DisplayIdExtension, DisplayIdSection } from 'edidts'
import { Button } from '@/components/ui/button'
import { bytesToHex, displayIdSectionWireLength } from '../common/editorUtils'

/**
 * Section-chain summary for a DisplayID extension: one row per
 * chained section with its live wire length and a remove affordance for
 * extension sections, plus the post-chain trailing bytes (read-only — they
 * are preserved verbatim on re-encode). Rows route to the section's
 * overview via the shared section ids.
 */
const props = defineProps<{
  displayId: DisplayIdExtension
  /** Chain index of the section whose overview is rendered (for row highlight). */
  activeSectionIndex: number
}>()

const emit = defineEmits<{
  addSection: []
  removeSection: [sectionIndex: number]
  select: [sectionId: string]
}>()

/** All chained sections; decoders populate `sections`, but extensions built
 *  programmatically may only carry the legacy `section` alias. */
const sections = computed<DisplayIdSection[]>(() =>
  props.displayId.sections && props.displayId.sections.length > 0
    ? props.displayId.sections
    : [props.displayId.section],
)

/** DisplayID 2.0 chains sections via the base section's extension count;
 *  v1.x extensions are single-section, so sections cannot be added. */
const canAddSection = computed(() => (sections.value[0]?.versionByte ?? 0) >= 0x20)

/** Sections occupy extension-block payload bytes 1..126 (byte 127 is the
 *  block checksum, which is not part of any section). */
const PAYLOAD_CAPACITY_BYTES = 126

const chainBytes = computed(() =>
  sections.value.reduce((sum, section) => sum + displayIdSectionWireLength(section), 0),
)

const trailingHex = computed(() => bytesToHex(props.displayId.trailingBytes ?? new Uint8Array(0)))

function sectionLabel(sectionIndex: number): string {
  return sectionIndex === 0 ? 'Base Section' : `Section ${sectionIndex + 1}`
}

function selectSection(sectionIndex: number) {
  emit('select', `displayid-s${sectionIndex}-overview`)
}
</script>

<template>
  <section>
    <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Section Chain</h4>
    <div class="space-y-2">
      <div
        v-for="(section, sectionIndex) in sections"
        :key="sectionIndex"
        class="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
        :class="{ 'border-primary/50': sectionIndex === activeSectionIndex }"
      >
        <button
          type="button"
          class="flex-1 text-left"
          :title="`View ${sectionLabel(sectionIndex)}`"
          @click="selectSection(sectionIndex)"
        >
          <span class="font-medium">{{ sectionLabel(sectionIndex) }}</span>
          <span class="ml-2 text-xs text-muted-foreground">
            {{ section.blocks.length }} block{{ section.blocks.length === 1 ? '' : 's' }}
            · {{ displayIdSectionWireLength(section) }} bytes
          </span>
        </button>
        <Button
          v-if="sectionIndex > 0"
          variant="ghost"
          size="sm"
          class="text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
          :title="`Remove ${sectionLabel(sectionIndex)}`"
          @click="emit('removeSection', sectionIndex)"
        >
          Remove
        </Button>
      </div>
      <p class="text-xs text-muted-foreground">
        Chain length: {{ chainBytes }} / {{ PAYLOAD_CAPACITY_BYTES }} bytes
      </p>
      <Button
        v-if="canAddSection"
        variant="outline"
        size="sm"
        class="w-full text-xs"
        :disabled="chainBytes + 5 > PAYLOAD_CAPACITY_BYTES"
        :title="chainBytes + 5 > PAYLOAD_CAPACITY_BYTES ? 'No space for another section' : undefined"
        @click="emit('addSection')"
      >
        + Add Section
      </Button>
    </div>
    <div v-if="trailingHex" class="mt-3 space-y-1">
      <p class="text-xs text-muted-foreground">
        Trailing bytes after the section chain (preserved verbatim on re-encode):
      </p>
      <p class="break-all font-mono text-xs">{{ trailingHex }}</p>
    </div>
  </section>
</template>