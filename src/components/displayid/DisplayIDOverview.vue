<script setup lang="ts">
import { computed } from 'vue'
import type { DisplayIdExtensionBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DisplayIDBlockList from './DisplayIDBlockList.vue'

const props = defineProps<{
  displayId: DisplayIdExtensionBlock
}>()

const emit = defineEmits<{
  removeBlock: [index: number]
  moveBlock: [index: number, direction: -1 | 1]
}>()

const sectionTooLarge = computed(() => props.displayId.section.totalLength > 125)
const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>DisplayID Overview</CardTitle>
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
            <span class="font-mono">{{ displayId.section.version }}.{{ displayId.section.revision }}</span>
          </div>
          <div :class="rowClass">
            <span class="text-muted-foreground">Section Bytes</span>
            <span :class="sectionTooLarge ? 'font-mono text-destructive' : 'font-mono'">{{ displayId.section.totalLength }} / 125</span>
          </div>
          <div :class="rowClass">
            <span class="text-muted-foreground">Checksum</span>
            <span :class="displayId.section.isChecksumValid ? 'text-emerald-500' : 'text-destructive'">
              {{ displayId.section.isChecksumValid ? 'Valid' : 'Invalid' }}
            </span>
          </div>
          <div :class="rowClass">
            <span class="text-muted-foreground">Primary Use</span>
            <span class="font-mono">0x{{ displayId.section.primaryUseCase.toString(16).padStart(2, '0') }}</span>
          </div>
          <div :class="rowClass">
            <span class="text-muted-foreground">Extensions</span>
            <span class="font-mono">{{ displayId.section.extensionCount }}</span>
          </div>
          <div :class="rowClass">
            <span class="text-muted-foreground">Blocks</span>
            <span class="font-mono">{{ displayId.section.blocks.length }}</span>
          </div>
        </div>
      </section>

      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Blocks</h4>
        <DisplayIDBlockList
          v-if="displayId.section.blocks.length > 0"
          :blocks="displayId.section.blocks"
          @remove="emit('removeBlock', $event)"
          @move="(index, direction) => emit('moveBlock', index, direction)"
        />
        <p v-else class="text-muted-foreground">No data blocks present.</p>
      </section>
    </CardContent>
  </Card>
</template>
