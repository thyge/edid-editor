<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronRight, X } from '@lucide/vue'
import type { EDIDViewModel } from '@/types/edid'
import { DISPLAY_ID_BLOCK_LABELS, getCEAExtension, getDisplayIdExtension } from 'edidts'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  if (blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x0D))
    items.push({ id: 'cea-video-format-pref', label: 'Video Format Preference' })
  if (blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x11))
    items.push({ id: 'cea-vendor-audio', label: 'Vendor-Specific Audio' })
  if (blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x13))
    items.push({ id: 'cea-room-config', label: 'Room Configuration' })
  if (blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x14))
    items.push({ id: 'cea-speaker-location', label: 'Speaker Location' })
  if (blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x20))
    items.push({ id: 'cea-infoframe', label: 'InfoFrame' })
  if (blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x05))
    items.push({ id: 'cea-vesa-transfer', label: 'VESA Transfer Characteristic' })
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
  if (!blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x0D))
    options.push({ type: 'video-format-preference', label: 'Video Format Preference' })
  if (!blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x11))
    options.push({ type: 'vendor-audio', label: 'Vendor-Specific Audio' })
  if (!blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x13))
    options.push({ type: 'room-config', label: 'Room Configuration' })
  if (!blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x14))
    options.push({ type: 'speaker-location', label: 'Speaker Location' })
  if (!blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x20))
    options.push({ type: 'infoframe', label: 'InfoFrame' })
  if (!blocks.some((b: import('edidts').CEADataBlock) => b.tag === 0x05))
    options.push({ type: 'vesa-transfer', label: 'VESA Transfer Characteristic' })
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

/** CTA child section id → (block tag, optional extended tag) for removal. */
const ceaChildRemoveMap: Record<string, [number, number?]> = {
  'cea-video': [0x02],
  'cea-audio': [0x01],
  'cea-speakers': [0x04],
  'cea-vendor': [0x03],
  'cea-hdr-color': [0x07, 0x05],
  'cea-video-cap': [0x07, 0x00],
  'cea-video-format-pref': [0x07, 0x0D],
  'cea-vendor-audio': [0x07, 0x11],
  'cea-room-config': [0x07, 0x13],
  'cea-speaker-location': [0x07, 0x14],
  'cea-infoframe': [0x07, 0x20],
  'cea-vesa-transfer': [0x05],
}

function removeCeaChild(id: string) {
  const r = ceaChildRemoveMap[id]
  if (r) emit('removeCeaBlock', r[0], r[1])
}

function selectSection(id: string) {
  emit('update:activeSection', id)
}

// Each top-level group is independently collapsible; default expanded.
const edidOpen = ref(true)
const ceaOpen = ref(true)
const displayIdOpen = ref(true)
</script>

<template>
  <Sidebar collapsible="none" side="left" class="border-r border-sidebar-border">
    <SidebarContent>
      <template v-if="edid">
        <!-- EDID base-block group -->
        <SidebarGroup>
          <Collapsible v-model:open="edidOpen">
            <div class="flex items-center gap-1">
              <CollapsibleTrigger
                class="flex h-8 w-6 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :aria-label="edidOpen ? 'Collapse EDID' : 'Expand EDID'"
              >
                <ChevronRight class="size-4 transition-transform" :class="{ 'rotate-90': edidOpen }" />
              </CollapsibleTrigger>
              <SidebarMenuButton
                class="flex-1 font-semibold"
                :is-active="activeSection === 'overview'"
                @click="selectSection('overview')"
              >
                EDID
              </SidebarMenuButton>
            </div>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem v-for="child in edidChildren" :key="child.id">
                    <SidebarMenuSubButton
                      as="button"
                      :is-active="activeSection === child.id"
                      @click="selectSection(child.id)"
                    >
                      {{ child.label }}
                    </SidebarMenuSubButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <!-- CTA-861 extension group -->
        <SidebarGroup v-if="hasCEA">
          <Collapsible v-model:open="ceaOpen">
            <div class="flex items-center gap-1">
              <CollapsibleTrigger
                class="flex h-8 w-6 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :aria-label="ceaOpen ? 'Collapse CEA' : 'Expand CEA'"
              >
                <ChevronRight class="size-4 transition-transform" :class="{ 'rotate-90': ceaOpen }" />
              </CollapsibleTrigger>
              <SidebarMenuButton
                class="flex-1 font-semibold"
                :is-active="activeSection === 'cea-overview'"
                @click="selectSection('cea-overview')"
              >
                CEA
              </SidebarMenuButton>
              <Button
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-6 p-0 shrink-0"
                title="Remove CEA extension"
                @click="emit('removeCea')"
              >
                <X class="size-3.5" />
              </Button>
            </div>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem
                  v-for="child in ceaChildren"
                  :key="child.id"
                  class="group/cea-child"
                >
                  <div class="flex items-center">
                    <SidebarMenuSubButton
                      as="button"
                      class="flex-1"
                      :is-active="activeSection === child.id"
                      @click="selectSection(child.id)"
                    >
                      {{ child.label }}
                    </SidebarMenuSubButton>
                    <button
                      v-if="child.id !== 'cea-header'"
                      class="text-destructive hover:text-destructive/80 h-5 w-5 flex items-center justify-center shrink-0 text-xs opacity-0 group-hover/cea-child:opacity-100 focus:opacity-100 transition-opacity"
                      :title="`Remove ${child.label}`"
                      @click.stop="removeCeaChild(child.id)"
                    >
                      <X class="size-3" />
                    </button>
                  </div>
                </SidebarMenuSubItem>

                <!-- Add data block -->
                <SidebarMenuSubItem v-if="addableBlocks.length > 0">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="sm" class="w-full text-xs text-muted-foreground h-7">
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
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup v-else>
          <Button variant="outline" size="sm" class="w-full text-xs" @click="emit('addCea')">
            Add CEA Extension
          </Button>
        </SidebarGroup>

        <!-- DisplayID extension group -->
        <SidebarGroup v-if="hasDisplayID">
          <Collapsible v-model:open="displayIdOpen">
            <div class="flex items-center gap-1">
              <CollapsibleTrigger
                class="flex h-8 w-6 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :aria-label="displayIdOpen ? 'Collapse DisplayID' : 'Expand DisplayID'"
              >
                <ChevronRight class="size-4 transition-transform" :class="{ 'rotate-90': displayIdOpen }" />
              </CollapsibleTrigger>
              <SidebarMenuButton
                class="flex-1 font-semibold"
                :is-active="activeSection === displayIdSectionIds.overview"
                @click="selectSection(displayIdSectionIds.overview)"
              >
                DisplayID
              </SidebarMenuButton>
              <Button
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-6 p-0 shrink-0"
                title="Remove DisplayID extension"
                @click="emit('removeDisplayId')"
              >
                <X class="size-3.5" />
              </Button>
            </div>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem
                  v-for="child in displayIdChildren"
                  :key="`${child.id}-${child.index ?? 'header'}`"
                  class="group/did-child"
                >
                  <div class="flex items-center">
                    <SidebarMenuSubButton
                      as="button"
                      class="flex-1"
                      :is-active="activeSection === child.id"
                      @click="selectSection(child.id)"
                    >
                      {{ child.label }}
                    </SidebarMenuSubButton>
                    <button
                      v-if="child.index !== undefined"
                      class="text-destructive hover:text-destructive/80 h-5 w-5 flex items-center justify-center shrink-0 text-xs opacity-0 group-hover/did-child:opacity-100 focus:opacity-100 transition-opacity"
                      :title="`Remove ${child.label}`"
                      @click.stop="emit('removeDisplayIdBlock', child.index)"
                    >
                      <X class="size-3" />
                    </button>
                  </div>
                </SidebarMenuSubItem>

                <SidebarMenuSubItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="sm" class="w-full text-xs text-muted-foreground h-7">
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
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup v-else>
          <Button variant="outline" size="sm" class="w-full text-xs" @click="emit('addDisplayId')">
            Add DisplayID Extension
          </Button>
        </SidebarGroup>
      </template>
    </SidebarContent>
  </Sidebar>
</template>