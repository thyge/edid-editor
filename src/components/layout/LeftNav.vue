<script setup lang="ts">
import { computed } from 'vue'
import type { EDIDViewModel } from '@/types/edid'
import { DISPLAY_ID_BLOCK_LABELS, getCEAExtension, getDisplayIdExtension } from 'edidts'
import { Button } from '@/components/ui/button'
import {
  addableDisplayIdBlocks,
  displayIdBlockSectionByTag,
  displayIdSectionIds,
} from '@/components/displayid/displayIdLabels'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const props = defineProps<{
  edid: EDIDViewModel | null
  activeSection: string
}>()

const emit = defineEmits<{
  'update:activeSection': [section: string]
  addCea: []
  removeCea: []
  addCeaBlock: [blockType: string]
  removeCeaBlock: [blockTag: number, extendedTag?: number]
  addDisplayId: []
  removeDisplayId: []
  addDisplayIdBlock: [tag: number]
  removeDisplayIdBlock: [index: number]
  moveDisplayIdBlock: [index: number, direction: -1 | 1]
}>()

const edidChildren = [
  { id: 'display-info', label: 'Display Information' },
  { id: 'color-gamut', label: 'Color Characteristics' },
  { id: 'timings-established', label: 'Established Timings' },
  { id: 'timings-standard', label: 'Standard Timings' },
  { id: 'descriptor-blocks', label: 'Detailed Timing Descriptor' },
]

const ceaExt = computed(() => props.edid ? getCEAExtension(props.edid) : null)

const hasCEA = computed(() => ceaExt.value !== null)

const ceaChildren = computed(() => {
  const cea = ceaExt.value
  if (!cea) return []
  const items: { id: string; label: string }[] = [
    { id: 'cea-header', label: 'Header & Flags' },
  ]
  const blocks = cea.dataBlocks
  if (blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x02)) items.push({ id: 'cea-video', label: 'Video (SVDs)' })
  if (blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x01)) items.push({ id: 'cea-audio', label: 'Audio (SADs)' })
  if (blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x04)) items.push({ id: 'cea-speakers', label: 'Speaker Allocation' })
  if (blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x03)) items.push({ id: 'cea-vendor', label: 'HDMI / Vendor' })
  const hasHdrOrColor = blocks.some((b: import('edidts').CEADataBlock) =>
    b.tag === 0x07 && ((b as { extendedTag?: number }).extendedTag === 0x05 ||
    (b as { extendedTag?: number }).extendedTag === 0x06 ||
    (b as { extendedTag?: number }).extendedTag === 0x07 ||
    (b as { extendedTag?: number }).extendedTag === 0x0E ||
    (b as { extendedTag?: number }).extendedTag === 0x0F)
  )
  if (hasHdrOrColor) items.push({ id: 'cea-hdr-color', label: 'HDR & Colorimetry' })
  const hasVideoCap = blocks.some((b: import('edidts').CEADataBlock) =>
    b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x00
  )
  if (hasVideoCap) items.push({ id: 'cea-video-cap', label: 'Video Capability' })
  if (cea.detailedTimings.length > 0) items.push({ id: 'cea-timings', label: 'Detailed Timings' })
  return items
})

const addableBlocks = computed(() => {
  const cea = ceaExt.value
  if (!cea) return []
  const blocks = cea.dataBlocks
  const options: { type: string; label: string }[] = []
  if (!blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x02)) options.push({ type: 'video', label: 'Video Data Block' })
  if (!blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x01)) options.push({ type: 'audio', label: 'Audio Data Block' })
  if (!blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x04)) options.push({ type: 'speakers', label: 'Speaker Allocation' })
  if (!blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x00))
    options.push({ type: 'video-capability', label: 'Video Capability' })
  if (!blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x05))
    options.push({ type: 'colorimetry', label: 'Colorimetry' })
  if (!blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x06))
    options.push({ type: 'hdr-static', label: 'HDR Static Metadata' })
  return options
})

const displayIdExt = computed(() => props.edid ? getDisplayIdExtension(props.edid) : null)

const hasDisplayID = computed(() => displayIdExt.value !== null)

interface DisplayIdNavChild {
  id: string
  label: string
  index?: number
}

const displayIdChildren = computed<DisplayIdNavChild[]>(() => {
  const displayId = displayIdExt.value
  if (!displayId) return []

  return [
    { id: displayIdSectionIds.header, label: 'Section Header' },
    ...displayId.section.blocks.map((block, index) => ({
      id: displayIdBlockSectionByTag[block.tag as number] ?? `${displayIdSectionIds.overview}-${index}`,
      label: DISPLAY_ID_BLOCK_LABELS[block.tag as keyof typeof DISPLAY_ID_BLOCK_LABELS] ?? `Unknown 0x${block.tag.toString(16).padStart(2, '0')}`,
      index,
    })),
  ]
})

function selectSection(id: string) {
  emit('update:activeSection', id)
}
</script>

<template>
  <aside class="w-52 border-r border-border bg-background p-3 flex flex-col gap-0.5 text-sm">
    <template v-if="edid">
      <!-- EDID root -->
      <button
        class="flex items-center gap-1.5 px-2 py-1.5 rounded-md font-semibold text-left w-full hover:bg-accent/50 transition-colors"
        :class="activeSection === 'overview' ? 'bg-accent text-accent-foreground' : 'text-foreground'"
        @click="selectSection('overview')"
      >
        EDID
      </button>

      <!-- EDID children -->
      <div class="ml-3 border-l border-border pl-2 flex flex-col gap-0.5">
        <button
          v-for="child in edidChildren"
          :key="child.id"
          class="px-2 py-1 rounded-md text-left w-full hover:bg-accent/50 transition-colors"
          :class="activeSection === child.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'"
          @click="selectSection(child.id)"
        >
          {{ child.label }}
        </button>
      </div>

      <!-- CEA extension -->
      <template v-if="hasCEA">
        <div class="flex items-center justify-between mt-1">
          <button
            class="flex items-center gap-1.5 px-2 py-1.5 rounded-md font-semibold text-left hover:bg-accent/50 transition-colors flex-1"
            :class="activeSection === 'cea-overview' ? 'bg-accent text-accent-foreground' : 'text-foreground'"
            @click="selectSection('cea-overview')"
          >
            CEA
          </button>
          <Button
            variant="ghost"
            size="sm"
            class="text-destructive hover:text-destructive hover:bg-destructive/10 h-6 w-6 p-0 shrink-0"
            title="Remove CEA extension"
            @click="emit('removeCea')"
          >
            ✕
          </Button>
        </div>

        <!-- CEA children -->
        <div class="ml-3 border-l border-border pl-2 flex flex-col gap-0.5">
          <template v-for="child in ceaChildren" :key="child.id">
            <div v-if="child.id === 'cea-header'" class="flex">
              <button
                class="px-2 py-1 rounded-md text-left w-full hover:bg-accent/50 transition-colors"
                :class="activeSection === child.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'"
                @click="selectSection(child.id)"
              >
                {{ child.label }}
              </button>
            </div>
            <div v-else class="flex items-center">
              <button
                class="px-2 py-1 rounded-md text-left flex-1 hover:bg-accent/50 transition-colors"
                :class="activeSection === child.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'"
                @click="selectSection(child.id)"
              >
                {{ child.label }}
              </button>
              <button
                class="text-destructive hover:text-destructive/80 h-5 w-5 flex items-center justify-center shrink-0 text-xs opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                :title="`Remove ${child.label}`"
                @click.stop="
                  child.id === 'cea-video' ? emit('removeCeaBlock', 0x02) :
                  child.id === 'cea-audio' ? emit('removeCeaBlock', 0x01) :
                  child.id === 'cea-speakers' ? emit('removeCeaBlock', 0x04) :
                  child.id === 'cea-vendor' ? emit('removeCeaBlock', 0x03) :
                  child.id === 'cea-hdr-color' ? emit('removeCeaBlock', 0x07, 0x05) :
                  child.id === 'cea-video-cap' ? emit('removeCeaBlock', 0x07, 0x00) :
                  undefined
                "
              >
                ✕
              </button>
            </div>
          </template>

          <!-- Add data block -->
          <DropdownMenu v-if="addableBlocks.length > 0">
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm" class="w-full text-xs text-muted-foreground mt-0.5 h-7">
                + Add Block
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                v-for="opt in addableBlocks"
                :key="opt.type"
                @click="emit('addCeaBlock', opt.type)"
              >
                {{ opt.label }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </template>

      <!-- Add CEA button -->
      <Button
        v-if="!hasCEA"
        variant="outline"
        size="sm"
        class="mt-2 w-full text-xs"
        @click="emit('addCea')"
      >
        Add CEA Extension
      </Button>

      <!-- DisplayID extension -->
      <template v-if="hasDisplayID">
        <div class="flex items-center justify-between mt-1">
          <button
            class="flex items-center gap-1.5 px-2 py-1.5 rounded-md font-semibold text-left hover:bg-accent/50 transition-colors flex-1"
            :class="activeSection === displayIdSectionIds.overview ? 'bg-accent text-accent-foreground' : 'text-foreground'"
            @click="selectSection(displayIdSectionIds.overview)"
          >
            DisplayID
          </button>
          <Button
            variant="ghost"
            size="sm"
            class="text-destructive hover:text-destructive hover:bg-destructive/10 h-6 w-6 p-0 shrink-0"
            title="Remove DisplayID extension"
            @click="emit('removeDisplayId')"
          >
            ✕
          </Button>
        </div>

        <div class="ml-3 border-l border-border pl-2 flex flex-col gap-0.5">
          <template v-for="child in displayIdChildren" :key="`${child.id}-${child.index ?? 'header'}`">
            <div v-if="child.index === undefined" class="flex">
              <button
                class="px-2 py-1 rounded-md text-left w-full hover:bg-accent/50 transition-colors"
                :class="activeSection === child.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'"
                @click="selectSection(child.id)"
              >
                {{ child.label }}
              </button>
            </div>
            <div v-else class="flex items-center">
              <button
                class="px-2 py-1 rounded-md text-left flex-1 hover:bg-accent/50 transition-colors"
                :class="activeSection === child.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'"
                @click="selectSection(child.id)"
              >
                {{ child.label }}
              </button>
              <button
                class="text-destructive hover:text-destructive/80 h-5 w-5 flex items-center justify-center shrink-0 text-xs opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                :title="`Remove ${child.label}`"
                @click.stop="emit('removeDisplayIdBlock', child.index)"
              >
                ✕
              </button>
            </div>
          </template>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm" class="w-full text-xs text-muted-foreground mt-0.5 h-7">
                + Add Block
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                v-for="opt in addableDisplayIdBlocks"
                :key="opt.tag"
                @click="emit('addDisplayIdBlock', opt.tag)"
              >
                {{ opt.label }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </template>

      <Button
        v-if="!hasDisplayID"
        variant="outline"
        size="sm"
        class="mt-2 w-full text-xs"
        @click="emit('addDisplayId')"
      >
        Add DisplayID Extension
      </Button>
    </template>
  </aside>
</template>
