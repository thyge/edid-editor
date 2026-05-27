<script setup lang="ts">
import { computed } from 'vue'
import type { EDIDViewModel } from '@/types/edid'
import { Button } from '@/components/ui/button'
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
}>()

const edidChildren = [
  { id: 'display-info', label: 'Display Information' },
  { id: 'color-gamut', label: 'Color Characteristics' },
  { id: 'timings-established', label: 'Established Timings' },
  { id: 'timings-standard', label: 'Standard Timings' },
  { id: 'descriptor-blocks', label: 'Detailed Timing Descriptor' },
]

const hasCEA = computed(() => props.edid?.ceaExtension !== null && props.edid?.ceaExtension !== undefined)

const ceaChildren = computed(() => {
  const cea = props.edid?.ceaExtension
  if (!cea) return []
  const items: { id: string; label: string }[] = [
    { id: 'cea-header', label: 'Header & Flags' },
  ]
  const blocks = cea.dataBlocks
  if (blocks.some(b => b.tag === 0x02)) items.push({ id: 'cea-video', label: 'Video (SVDs)' })
  if (blocks.some(b => b.tag === 0x01)) items.push({ id: 'cea-audio', label: 'Audio (SADs)' })
  if (blocks.some(b => b.tag === 0x04)) items.push({ id: 'cea-speakers', label: 'Speaker Allocation' })
  if (blocks.some(b => b.tag === 0x03)) items.push({ id: 'cea-vendor', label: 'HDMI / Vendor' })
  const hasHdrOrColor = blocks.some(b =>
    b.tag === 0x07 && ((b as { extendedTag?: number }).extendedTag === 0x05 ||
    (b as { extendedTag?: number }).extendedTag === 0x06 ||
    (b as { extendedTag?: number }).extendedTag === 0x07 ||
    (b as { extendedTag?: number }).extendedTag === 0x0E ||
    (b as { extendedTag?: number }).extendedTag === 0x0F)
  )
  if (hasHdrOrColor) items.push({ id: 'cea-hdr-color', label: 'HDR & Colorimetry' })
  const hasVideoCap = blocks.some(b =>
    b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x00
  )
  if (hasVideoCap) items.push({ id: 'cea-video-cap', label: 'Video Capability' })
  if (cea.detailedTimings.length > 0) items.push({ id: 'cea-timings', label: 'Detailed Timings' })
  return items
})

const addableBlocks = computed(() => {
  const cea = props.edid?.ceaExtension
  if (!cea) return []
  const blocks = cea.dataBlocks
  const options: { type: string; label: string }[] = []
  if (!blocks.some(b => b.tag === 0x02)) options.push({ type: 'video', label: 'Video Data Block' })
  if (!blocks.some(b => b.tag === 0x01)) options.push({ type: 'audio', label: 'Audio Data Block' })
  if (!blocks.some(b => b.tag === 0x04)) options.push({ type: 'speakers', label: 'Speaker Allocation' })
  if (!blocks.some(b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x00))
    options.push({ type: 'video-capability', label: 'Video Capability' })
  if (!blocks.some(b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x05))
    options.push({ type: 'colorimetry', label: 'Colorimetry' })
  if (!blocks.some(b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x06))
    options.push({ type: 'hdr-static', label: 'HDR Static Metadata' })
  return options
})

const hasDisplayID = computed(() =>
  props.edid?.extensionBlocks?.some(b => b.tag === 0x70) ?? false
)

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
      <button
        v-if="hasDisplayID"
        class="flex items-center gap-1.5 px-2 py-1.5 rounded-md font-semibold text-left w-full mt-1 text-muted-foreground cursor-default opacity-60"
        disabled
      >
        DisplayID
      </button>
    </template>
  </aside>
</template>
