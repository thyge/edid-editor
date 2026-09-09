<script setup lang="ts">
import { computed } from 'vue'
import type { DisplayIdExtension, DisplayIdSection } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DisplayIDBlockList from './DisplayIDBlockList.vue'
import DisplayIDSectionChain from './DisplayIDSectionChain.vue'
import { displayIdSectionWireLength } from '../common/editorUtils'

/**
 * Overview of one chained DisplayID section: the section the
 * `sectionIndex` prop points at, plus the extension-wide section chain.
 */
const props = defineProps<{
  displayId: DisplayIdExtension
  /** Chain index of the section this overview renders. */
  sectionIndex: number
}>()

const emit = defineEmits<{
  removeBlock: [sectionIndex: number, index: number]
  moveBlock: [sectionIndex: number, index: number, direction: -1 | 1]
  addSection: []
  removeSection: [sectionIndex: number]
  selectSection: [sectionId: string]
}>()

/** All chained sections; decoders populate `sections`, but extensions built
 *  programmatically may only carry the legacy `section` alias. */
const sections = computed<DisplayIdSection[]>(() =>
  props.displayId.sections && props.displayId.sections.length > 0
    ? props.displayId.sections
    : [props.displayId.section],
)

const section = computed<DisplayIdSection | null>(() => sections.value[props.sectionIndex] ?? null)

// Live wire length (the decoded totalLength goes stale as blocks are edited);
// the encoder caps a section at the 128-byte extension block.
const wireLength = computed(() => (section.value ? displayIdSectionWireLength(section.value) : 0))
const sectionTooLarge = computed(() => wireLength.value > 125)
const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'

function onRemoveBlock(index: number) {
  emit('removeBlock', props.sectionIndex, index)
}

function onMoveBlock(index: number, direction: -1 | 1) {
  emit('moveBlock', props.sectionIndex, index, direction)
}
</script>

<template>
  <Card v-if="section">
    <CardHeader>
      <CardTitle>
        DisplayID Overview — {{ sectionIndex === 0 ? 'Base Section' : `Section ${sectionIndex + 1}` }}
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Section</h4>
        <div v-if="sectionTooLarge" class="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Section length exceeds the 125-byte EDID extension payload.
        </div>
        <div class="grid grid-cols-3 gap-x-6 gap-y-2">
          <div :class="rowClass">
            <span class="text-muted-foreground">Version</span>
            <span class="font-mono">{{ section.version }}.{{ section.revision }}</span>
          </div>
          <div :class="rowClass">
            <span class="text-muted-foreground">Section Bytes</span>
            <span :class="sectionTooLarge ? 'font-mono text-destructive' : 'font-mono'">{{ wireLength }} / 125</span>
          </div>
          <div :class="rowClass">
            <span class="text-muted-foreground">Checksum</span>
            <span :class="section.isChecksumValid ? 'text-emerald-500' : 'text-destructive'">
              {{ section.isChecksumValid ? 'Valid' : 'Invalid' }}
            </span>
          </div>
          <div :class="rowClass">
            <span class="text-muted-foreground">Primary Use</span>
            <span class="font-mono">0x{{ section.primaryUseCase.toString(16).padStart(2, '0') }}</span>
          </div>
          <div :class="rowClass">
            <span class="text-muted-foreground">Extensions</span>
            <span class="font-mono">{{ section.extensionCount }}</span>
          </div>
          <div :class="rowClass">
            <span class="text-muted-foreground">Blocks</span>
            <span class="font-mono">{{ section.blocks.length }}</span>
          </div>
        </div>
      </section>

      <DisplayIDSectionChain
        :display-id="displayId"
        :active-section-index="sectionIndex"
        @add-section="emit('addSection')"
        @remove-section="emit('removeSection', $event)"
        @select="(sectionId: string) => emit('selectSection', sectionId)"
      />

      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Blocks</h4>
        <DisplayIDBlockList
          v-if="section.blocks.length > 0"
          :blocks="section.blocks"
          @remove="onRemoveBlock"
          @move="onMoveBlock"
        />
        <p v-else class="text-muted-foreground">No data blocks present.</p>
      </section>
    </CardContent>
  </Card>
</template>