<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronRight, X } from '@lucide/vue'
import type { EDIDViewModel } from '@/types/edid'
import {
  getCEAExtension,
  getDisplayIdExtension,
  createDefaultCEADataBlock,
  ExtensionBlockParser,
  type CEADefaultBlockType,
  type DetailedTimingDescriptor,
  DISPLAY_DESCRIPTOR_OPTIONS,
  getDisplayDescriptorLabel,
} from 'edidts'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
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
  displayIdBlockLabel,
  displayIdBlockSectionByTag,
  displayIdSectionIds,
} from '@/components/displayid/displayIdLabels'
import { isVendorBlock, vendorBlockLabel } from '@/components/cta/vendorLabels'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const props = defineProps<{
  edid: EDIDViewModel | null
  activeSection: string
}>()

const emit = defineEmits<{
  'update:activeSection': [section: string]
  addEdidTiming: [presetKey?: string]
  removeEdidTiming: [index: number]
  addEdidDescriptor: [tag: number]
  removeEdidDescriptor: [index: number]
  addCea: []
  removeCea: []
  addCeaTiming: [presetKey?: string]
  addCeaBlock: [blockType: string]
  removeCeaBlock: [blockTag: number, extendedTag?: number]
  removeCeaBlockByIndex: [index: number]
  addDisplayId: []
  removeDisplayId: []
  addDisplayIdBlock: [tag: number]
  removeDisplayIdBlock: [index: number]
  moveDisplayIdBlock: [index: number, direction: -1 | 1]
}>()

// Fixed base-block sections — always present, not addable/removable.
const edidFixedChildren = [
  { id: 'display-info', label: 'Display Information' },
  { id: 'color-gamut', label: 'Color Characteristics' },
  { id: 'timings-established', label: 'Established Timings' },
  { id: 'timings-standard', label: 'Standard Timings' },
]

const edidBase = computed(() => props.edid?.base ?? null)

// Friendly label for a detailed timing: "1920×1080p60". Falls back to
// "Timing N" for blank/zeroed DTDs (e.g. a freshly added empty slot).
function timingNavLabel(t: DetailedTimingDescriptor, i: number): string {
  if (t.horizontalActive > 0 && t.verticalActive > 0) {
    const scan = t.flags.interlaced ? 'i' : 'p'
    return `${t.horizontalActive}×${t.verticalActive}${scan}${Math.round(t.refreshRate)}`
  }
  return `Timing ${i + 1}`
}

// Detailed timings are first-class, removable nav entries (like CTA blocks).
const edidDtdChildren = computed(() => {
  const base = edidBase.value
  if (!base) return []
  return base.detailedTimings.map((t, i) => ({
    id: `edid-dtd-${i}`,
    label: timingNavLabel(t, i),
    index: i,
  }))
})

// Meaningful display descriptors (dummy 0x10 slots are filtered out) as
// first-class, removable nav entries. `index` is the source index in the full
// displayDescriptors array, matching the existing removeDescriptor contract.
const edidDescriptorChildren = computed(() => {
  const base = edidBase.value
  if (!base) return []
  return base.displayDescriptors
    .map((d, sourceIndex) => ({ d, sourceIndex }))
    .filter(({ d }) => d.tag !== 0x10)
    .map(({ d, sourceIndex }) => ({
      id: `edid-desc-${sourceIndex}`,
      label: getDisplayDescriptorLabel(d.tag),
      index: sourceIndex,
    }))
})

// EDID 1.4 has exactly four 18-byte descriptor slots shared between detailed
// timings and display descriptors; the add affordance disappears once full.
const edidCanAdd = computed(() => {
  const base = edidBase.value
  if (!base) return false
  const meaningful = base.displayDescriptors.filter((d) => d.tag !== 0x10).length
  return base.detailedTimings.length + meaningful < 4
})

type EdidAddOption = { kind: 'descriptor'; tag: number; label: string; key: string }

const edidAddOptions = computed<EdidAddOption[]>(() => {
  if (!edidCanAdd.value) return []
  return DISPLAY_DESCRIPTOR_OPTIONS.map((o) => ({
    kind: 'descriptor' as const,
    tag: o.tag,
    label: o.label,
    key: `edid-add-desc-${o.tag}`,
  }))
})

/**
 * Bytes still free in the CTA payload area (bytes 4..126) after the encoded
 * data-block stream and the existing 18-byte DTDs (TASK-110). Both "+ Add"
 * paths draw from this shared budget. Derived from the reactive CEA tree, so
 * adding/removing any data block or timing immediately re-evaluates it.
 */
const ceaFreeBytes = computed(() => {
  const cea = ceaExt.value
  if (!cea) return 0
  return ExtensionBlockParser.getCeaFreePayloadBytes(cea)
})

/** CTA detailed timings are addable while an 18-byte DTD fits the remaining
 *  payload area shared with the data blocks (TASK-110). */
const ceaCanAddTiming = computed(() => ceaFreeBytes.value >= ExtensionBlockParser.CEA_DTD_SIZE)

/** Hover hint for the + Add Timing action, explaining why it is disabled when full. */
const addTimingTitle = computed(() =>
  ceaCanAddTiming.value
    ? 'Add a detailed timing descriptor (1080p60 default)'
    : `No space for another 18-byte timing (${ceaFreeBytes.value} of ${ExtensionBlockParser.CEA_PAYLOAD_CAPACITY} bytes free) — remove a data block or timing first`,
)

// True when the active section is the combined Descriptors view or any
// individual DTD/descriptor entry — used to highlight the sub-group header.
const isEdidDescriptorSection = computed(() =>
  props.activeSection === 'edid-descriptors' ||
  props.activeSection.startsWith('edid-dtd-') ||
  props.activeSection.startsWith('edid-desc-')
)

const ceaExt = computed(() => props.edid ? getCEAExtension(props.edid) : null)

const hasCEA = computed(() => ceaExt.value !== null)

/**
 * Vendor-specific blocks of ALL carriers as first-class, removable nav
 * children of one sub-group (TASK-102): tag 0x03 VSDBs, tag 0x07 ext 0x01
 * VSVDBs (Dolby Vision, HDR10+), and tag 0x07 ext 0x11 Vendor-Specific Audio.
 * `index` is the block's dataBlocks index — the root of the per-block edit
 * path (dataBlocks.<idx>…) and the by-index removal contract.
 */
const vendorChildren = computed(() => {
  const cea = ceaExt.value
  if (!cea) return []
  return cea.dataBlocks.flatMap((b, index) =>
    isVendorBlock(b)
      ? [{ id: `cea-vendor-block-${index}`, label: vendorBlockLabel(b), index }]
      : [])
})

/** True when the active section is the combined vendor view or any individual
 *  vendor block — used to highlight the sub-group header. */
const isVendorSection = computed(() =>
  props.activeSection === 'cea-vendor' ||
  props.activeSection.startsWith('cea-vendor-block-')
)

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

/**
 * One "+ Add Block" option: the default-block factory discriminator, its menu
 * label, and whether its default block still fits the remaining payload area
 * (TASK-110 — non-fitting options render disabled with the reason in the
 * label suffix, they are not silently hidden).
 */
type CeaAddBlockOption = { type: CEADefaultBlockType; label: string; fits: boolean }

/** True when the default block for `type` fits the free payload area. */
function defaultBlockFits(type: CEADefaultBlockType): boolean {
  const block = createDefaultCEADataBlock(type)
  if (!block) return false
  return ExtensionBlockParser.getCeaEncodedBlockBytes(block) <= ceaFreeBytes.value
}

const addableBlocks = computed(() => {
  const cea = ceaExt.value
  if (!cea) return []
  const blocks = cea.dataBlocks
  const options: { type: CEADefaultBlockType; label: string }[] = []
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
  return options.map((o) => ({ ...o, fits: defaultBlockFits(o.type) }))
})

/** Vendor-specific data blocks (tag 0x03, TASK-109): multiple VSDBs may
 *  legally coexist, so unlike the deduped short blocks above these options
 *  are always offered — the dropdown item itself picks the vendor type to
 *  instantiate. */
const VSDB_ADD_OPTIONS: ReadonlyArray<{ type: CEADefaultBlockType; label: string }> = [
  { type: 'vsdb-hdmi14', label: 'Vendor Block: HDMI 1.4' },
  { type: 'vsdb-hdmi-forum', label: 'Vendor Block: HDMI Forum' },
  { type: 'vsdb-microsoft-hmd', label: 'Vendor Block: Microsoft HMD' },
  { type: 'vsdb-amd', label: 'Vendor Block: AMD FreeSync' },
  { type: 'vsdb-mhl', label: 'Vendor Block: MHL' },
]

const addableVsdbBlocks = computed<CeaAddBlockOption[]>(() => {
  if (!ceaExt.value) return []
  return VSDB_ADD_OPTIONS.map((o) => ({ ...o, fits: defaultBlockFits(o.type) }))
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
      label: displayIdBlockLabel(block.tag),
      index,
    })),
  ]
})

/** CTA child section id → (block tag, optional extended tag) for removal. */
const ceaChildRemoveMap: Record<string, [number, number?]> = {
  'cea-video': [0x02],
  'cea-audio': [0x01],
  'cea-speakers': [0x04],
  'cea-hdr-color': [0x07, 0x05],
  'cea-video-cap': [0x07, 0x00],
  'cea-video-format-pref': [0x07, 0x0D],
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
const edidDescriptorsOpen = ref(true)
const ceaOpen = ref(true)
const ceaVendorOpen = ref(true)
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
              <SidebarMenuSub>
                <!-- Fixed base-block sections -->
                <SidebarMenuSubItem
                  v-for="child in edidFixedChildren"
                  :key="child.id"
                >
                  <SidebarMenuSubButton
                    as="button"
                    :is-active="activeSection === child.id"
                    @click="selectSection(child.id)"
                  >
                    {{ child.label }}
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>

                <!-- Detailed timings & display descriptors: own collapsible
                     sub-group. The four shared 18-byte slots are the add
                     budget; the "+ Add" dropdown offers a DTD or any
                     descriptor type. -->
                <SidebarMenuSubItem>
                  <Collapsible v-model:open="edidDescriptorsOpen">
                    <div class="flex items-center gap-1">
                      <CollapsibleTrigger
                        class="flex h-7 w-5 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        :aria-label="edidDescriptorsOpen ? 'Collapse descriptors' : 'Expand descriptors'"
                      >
                        <ChevronRight class="size-3.5 transition-transform" :class="{ 'rotate-90': edidDescriptorsOpen }" />
                      </CollapsibleTrigger>
                      <button
                        class="flex-1 text-left rounded-md px-1 py-0.5 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        :class="{ 'text-sidebar-accent-foreground font-semibold': isEdidDescriptorSection }"
                        @click="selectSection('edid-descriptors')"
                      >
                        Descriptors
                      </button>
                    </div>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <!-- Detailed timings (removable) -->
                        <SidebarMenuSubItem
                          v-for="child in edidDtdChildren"
                          :key="child.id"
                          class="group/edid-child"
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
                              class="text-destructive hover:text-destructive/80 h-5 w-5 flex items-center justify-center shrink-0 text-xs opacity-0 group-hover/edid-child:opacity-100 focus:opacity-100 transition-opacity"
                              :title="`Remove ${child.label}`"
                              @click.stop="emit('removeEdidTiming', child.index)"
                            >
                              <X class="size-3" />
                            </button>
                          </div>
                        </SidebarMenuSubItem>

                        <!-- Display descriptors (removable) -->
                        <SidebarMenuSubItem
                          v-for="child in edidDescriptorChildren"
                          :key="child.id"
                          class="group/edid-child"
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
                              class="text-destructive hover:text-destructive/80 h-5 w-5 flex items-center justify-center shrink-0 text-xs opacity-0 group-hover/edid-child:opacity-100 focus:opacity-100 transition-opacity"
                              :title="`Remove ${child.label}`"
                              @click.stop="emit('removeEdidDescriptor', child.index)"
                            >
                              <X class="size-3" />
                            </button>
                          </div>
                        </SidebarMenuSubItem>

                        <!-- Add detailed timing / display descriptor -->
                        <SidebarMenuSubItem v-if="edidAddOptions.length > 0">
                          <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                              <Button variant="ghost" size="sm" class="w-full text-xs text-muted-foreground h-7">
                                + Add
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <!-- Detailed Timing: adds a default 1080p60
                                   standard-CVT DTD. Pick a different preset from
                                   inside the timing card's Preset row. -->
                              <DropdownMenuItem @click="emit('addEdidTiming')">
                                Detailed Timing
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                v-for="opt in edidAddOptions"
                                :key="opt.key"
                                @click="emit('addEdidDescriptor', opt.tag)"
                              >
                                {{ opt.label }}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <!-- CTA-861 extension group -->
        <SidebarGroup v-if="hasCEA">
          <Collapsible v-model:open="ceaOpen">
            <div class="flex items-center gap-1">
              <CollapsibleTrigger
                class="flex h-8 w-6 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :aria-label="ceaOpen ? 'Collapse CTA-861' : 'Expand CTA-861'"
              >
                <ChevronRight class="size-4 transition-transform" :class="{ 'rotate-90': ceaOpen }" />
              </CollapsibleTrigger>
              <SidebarMenuButton
                class="flex-1 font-semibold"
                :is-active="activeSection === 'cea-overview'"
                @click="selectSection('cea-overview')"
              >
                CTA-861
              </SidebarMenuButton>
              <Button
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-6 p-0 shrink-0"
                title="Remove CTA-861 extension"
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

                <!-- Vendor-specific blocks (VSDB / VSVDB / vendor audio): one
                     collapsible sub-group mirroring the EDID Descriptors
                     pattern. The header opens the combined vendor view; each
                     child row is one vendor block (labeled by vendor/OUI) with
                     its own by-index remove (TASK-102). -->
                <SidebarMenuSubItem v-if="vendorChildren.length > 0">
                  <Collapsible v-model:open="ceaVendorOpen">
                    <div class="flex items-center gap-1">
                      <CollapsibleTrigger
                        class="flex h-7 w-5 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        :aria-label="ceaVendorOpen ? 'Collapse vendor blocks' : 'Expand vendor blocks'"
                      >
                        <ChevronRight class="size-3.5 transition-transform" :class="{ 'rotate-90': ceaVendorOpen }" />
                      </CollapsibleTrigger>
                      <button
                        class="flex-1 text-left rounded-md px-1 py-0.5 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        :class="{ 'text-sidebar-accent-foreground font-semibold': isVendorSection }"
                        @click="selectSection('cea-vendor')"
                      >
                        Vendor Blocks
                      </button>
                    </div>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem
                          v-for="child in vendorChildren"
                          :key="child.id"
                          class="group/cea-vendor-child"
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
                              class="text-destructive hover:text-destructive/80 h-5 w-5 flex items-center justify-center shrink-0 text-xs opacity-0 group-hover/cea-vendor-child:opacity-100 focus:opacity-100 transition-opacity"
                              :title="`Remove ${child.label}`"
                              @click.stop="emit('removeCeaBlockByIndex', child.index)"
                            >
                              <X class="size-3" />
                            </button>
                          </div>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuSubItem>

                <!-- Add CTA detailed timing: adds a default 1080p60 standard-CVT
                     DTD. Pick a different preset from inside the timing card's
                     Preset row. Disabled (with the reason as hover hint) when
                     the payload area shared with the data blocks can't hold
                     another 18-byte DTD (TASK-110). -->
                <SidebarMenuSubItem>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="w-full text-xs text-muted-foreground h-7"
                    :disabled="!ceaCanAddTiming"
                    :title="addTimingTitle"
                    @click="emit('addCeaTiming')"
                  >
                    + Add Timing
                  </Button>
                </SidebarMenuSubItem>

                <!-- Add data block: short blocks are deduped (single-instance)
                     and VSDBs are always offered (multiple legal, TASK-109) in
                     their own group. Options whose default block would not fit
                     the remaining payload area render disabled with a
                     "(no space)" suffix instead of silently vanishing
                     (TASK-110). -->
                <SidebarMenuSubItem v-if="addableBlocks.length > 0 || addableVsdbBlocks.length > 0">
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
                        :disabled="!opt.fits"
                        @click="emit('addCeaBlock', opt.type)"
                      >
                        {{ opt.label }}{{ opt.fits ? '' : ' (no space)' }}
                      </DropdownMenuItem>
                      <template v-if="addableVsdbBlocks.length > 0">
                        <DropdownMenuSeparator v-if="addableBlocks.length > 0" />
                        <DropdownMenuLabel>Vendor-Specific Data Blocks</DropdownMenuLabel>
                        <DropdownMenuItem
                          v-for="opt in addableVsdbBlocks"
                          :key="opt.type"
                          :disabled="!opt.fits"
                          @click="emit('addCeaBlock', opt.type)"
                        >
                          {{ opt.label }}{{ opt.fits ? '' : ' (no space)' }}
                        </DropdownMenuItem>
                      </template>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup v-else>
          <Button variant="outline" size="sm" class="w-full text-xs" @click="emit('addCea')">
            Add CTA-861 Extension
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