<script setup lang="ts">
import { ref, computed, type Ref } from 'vue'
import { ChevronRight, X } from '@lucide/vue'
import type { EDIDViewModel } from '@/types/edid'
import {
  getCEAExtension,
  getDisplayIdExtension,
  createDefaultCEADataBlock,
  ExtensionBlockParser,
  type CEADefaultBlockType,
  type CEADetailedTiming,
  type DetailedTimingDescriptor,
  DISPLAY_DESCRIPTOR_OPTIONS,
  getDisplayDescriptorLabel,
} from 'edidts'
import { timingNameLabel } from '@/components/common/timingLabels'
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
  displayIdBlockSectionId,
  displayIdSectionIds,
} from '@/components/displayid/displayIdLabels'
import { ctaBlockFamily, ctaBlockNavLabel, type CtaBlockFamily } from '@/components/cta/ctaBlockOrder'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  removeCeaTimingByIndex: [index: number]
  addCeaBlock: [blockType: string]
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

// Friendly label for a detailed timing: "1920×1080p60" (TASK-119 shared
// helper). Falls back to "Timing N" for blank/zeroed DTDs (e.g. a freshly
// added empty slot).
function timingNavLabel(t: DetailedTimingDescriptor, i: number): string {
  return timingNameLabel(t, `Timing ${i + 1}`)
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

/** One per-block nav entry — `index` is the block's dataBlocks index, the
 *  root of its per-block edit path and by-index removal contract. */
interface CeaBlockChild {
  id: string
  label: string
  index: number
}

/** Render model for the CTA nav (TASK-114): the extension is a collection of
 *  blocks, so entries mirror the encoded (dataBlocks) order verbatim —
 *  Header & Flags first, every data block in its decoded position, Detailed
 *  Timings last (per Table 53 the DTDs follow the entire Data Block
 *  Collection). VSDB and VCDB-family blocks render as children of collapsible
 *  sub-group callouts, placed at the family's first occurrence; a family
 *  whose members interleave with other blocks is still collected under the
 *  one header (nav presentation only — the data order is untouched). */
type CeaNavNode =
  | { kind: 'header'; key: 'header' }
  | { kind: 'block'; key: string; child: CeaBlockChild }
  | { kind: 'family'; key: string; family: CtaBlockFamily; label: string; children: CeaBlockChild[] }
  | { kind: 'timings'; key: 'timings' }

const CTA_FAMILY_LABELS: Readonly<Record<CtaBlockFamily, string>> = {
  vsdb: 'Vendor-Specific Data Blocks',
  vcdb: 'Video Capability Data Blocks',
}

const ceaNavItems = computed<CeaNavNode[]>(() => {
  const cea = ceaExt.value
  if (!cea) return [{ kind: 'header', key: 'header' }]
  const items: CeaNavNode[] = [{ kind: 'header', key: 'header' }]
  const families = new Map<CtaBlockFamily, CeaBlockChild[]>()
  cea.dataBlocks.forEach((block, index) => {
    const family = ctaBlockFamily(block)
    if (family) {
      let children = families.get(family)
      if (!children) {
        children = []
        families.set(family, children)
        items.push({ kind: 'family', key: `family-${family}`, family, label: CTA_FAMILY_LABELS[family], children })
      }
      children.push({ id: `cea-block-${index}`, label: ctaBlockNavLabel(block), index })
      return
    }
    items.push({
      kind: 'block',
      key: `block-${index}`,
      child: { id: `cea-block-${index}`, label: ctaBlockNavLabel(block), index },
    })
  })
  // Detailed Timings sub-group (TASK-112): always present when a CEA
  // extension exists, last per Table 53 (DTDs follow the entire Data Block
  // Collection).
  items.push({ kind: 'timings', key: 'timings' })
  return items
})

/** dataBlocks index of the active per-block section (cea-block-<idx>), or -1. */
const activeCeaBlockIndex = computed(() => {
  const prefix = 'cea-block-'
  if (!props.activeSection.startsWith(prefix)) return -1
  const index = Number(props.activeSection.slice(prefix.length))
  return Number.isInteger(index) && index >= 0 ? index : -1
})

/** Family of the active per-block section — highlights its callout header. */
const activeCeaBlockFamily = computed<CtaBlockFamily | null>(() => {
  const cea = ceaExt.value
  const index = activeCeaBlockIndex.value
  if (!cea || index < 0) return null
  const block = cea.dataBlocks[index]
  return block ? ctaBlockFamily(block) : null
})

/** Friendly label for a CTA detailed timing — same "1920×1080p60" shape as
 *  {@link timingNavLabel} via the TASK-119 shared helper (CTA timings are
 *  plain DetailedTiming records, no refreshRate getter). */
function ceaTimingNavLabel(t: CEADetailedTiming, i: number): string {
  return timingNameLabel(t, `Timing ${i + 1}`)
}

/** One per-timing nav entry of the "Detailed Timings" sub-group (TASK-112):
 *  `index` is the timing's detailedTimings index, the root of its per-child
 *  edit path and by-index removal contract. */
const ceaTimingChildren = computed(() => {
  const cea = ceaExt.value
  if (!cea) return []
  return cea.detailedTimings.map((t, i) => ({
    id: `cea-dtd-${i}`,
    label: ceaTimingNavLabel(t, i),
    index: i,
  }))
})

/** True when the active section is the combined timings view or any
 *  individual DTD entry — used to highlight the sub-group header. */
const isCeaTimingSection = computed(() =>
  props.activeSection === 'cea-timings' ||
  props.activeSection.startsWith('cea-dtd-')
)

/**
 * One "+ Add Block" option: the factory discriminator, its menu label, whether
 * its default block still fits the remaining payload area (TASK-110 —
 * non-fitting options render disabled with a "(no space)" label suffix and
 * the reason as hover hint, they are not silently hidden).
 */
interface CeaAddOption {
  type: CEADefaultBlockType
  label: string
  fits: boolean
  /** Hover hint for a disabled (non-fitting) option. */
  noSpaceTitle?: string
}

/** Short blocks are single-instance: an option is offered only while no block
 *  of that type is present. VSDBs are exempt (multiple legal, TASK-109). */
function hasBlock(pred: (b: import('edidts').CEADataBlock) => boolean): boolean {
  return !!ceaExt.value?.dataBlocks.some(pred)
}

/** Extended-tag presence test for tag-0x07 blocks. */
function hasExtBlock(ext: number): boolean {
  return hasBlock(b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === ext)
}

/** Build one option with its payload-capacity guard. */
function addOption(type: CEADefaultBlockType, label: string): CeaAddOption {
  const block = createDefaultCEADataBlock(type)
  if (!block) return { type, label, fits: false }
  const needed = ExtensionBlockParser.getCeaEncodedBlockBytes(block)
  const free = ceaFreeBytes.value
  return needed <= free
    ? { type, label, fits: true }
    : {
        type,
        label,
        fits: false,
        noSpaceTitle: `Needs ${needed} bytes; only ${free} of ${ExtensionBlockParser.CEA_PAYLOAD_CAPACITY} free — remove a data block or timing first`,
      }
}

/**
 * One node of the Add Block menu (TASK-117): a direct item, or a cascading
 * sub-menu holding one family's options.
 */
type CeaAddBlockMenuNode =
  | { kind: 'item'; key: string; option: CeaAddOption }
  | { kind: 'sub'; key: string; family: CtaBlockFamily; label: string; options: CeaAddOption[] }

const addBlockMenu = computed<CeaAddBlockMenuNode[]>(() => {
  if (!ceaExt.value) return []
  const nodes: CeaAddBlockMenuNode[] = []
  const add = (type: CEADefaultBlockType, label: string, present: boolean) => {
    if (!present) nodes.push({ kind: 'item', key: type, option: addOption(type, label) })
  }
  // Canonical add order (TASK-114): Video, Audio, Speaker Allocation, VSDBs
  // (cascade, TASK-117), Colorimetry, the VCDB family (cascade, TASK-117:
  // Video Capability, Vendor-Specific Audio, InfoFrame, Video Format
  // Preference, HDR Static), Room Configuration, Speaker Location, then
  // unlisted types (VESA Display Device).
  add('video', 'Video Data Block', hasBlock(b => b.tag === 0x02))
  add('audio', 'Audio Data Block', hasBlock(b => b.tag === 0x01))
  add('speakers', 'Speaker Allocation', hasBlock(b => b.tag === 0x04))
  nodes.push({
    kind: 'sub',
    key: 'sub-vsdb',
    family: 'vsdb',
    label: CTA_FAMILY_LABELS.vsdb,
    // VSDBs are always offered — multiple may legally coexist (TASK-109).
    options: VSDB_ADD_OPTIONS.map((opt) => addOption(opt.type, opt.label)),
  })
  add('colorimetry', 'Colorimetry', hasExtBlock(0x05))
  // Single-instance family members are deduped like the flat items; the
  // cascade itself is dropped when every member is already present.
  const vcdbOptions = ([
    ['video-capability', 'Video Capability', 0x00],
    ['vendor-audio', 'Vendor-Specific Audio', 0x11],
    ['infoframe', 'InfoFrame', 0x20],
    ['video-format-preference', 'Video Format Preference', 0x0d],
    ['hdr-static', 'HDR Static Metadata', 0x06],
  ] as const)
    .filter(([, , ext]) => !hasExtBlock(ext))
    .map(([type, label]) => addOption(type, label))
  if (vcdbOptions.length > 0) {
    nodes.push({ kind: 'sub', key: 'sub-vcdb', family: 'vcdb', label: CTA_FAMILY_LABELS.vcdb, options: vcdbOptions })
  }
  add('room-config', 'Room Configuration', hasExtBlock(0x13))
  add('speaker-location', 'Speaker Location', hasExtBlock(0x14))
  add('vesa-transfer', 'VESA Transfer Characteristic', hasBlock(b => b.tag === 0x05))
  return nodes
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
    // One section id per block index (displayid-block-<idx>) so every tag —
    // v1.x or v2.0, known or unknown, duplicated or not — has its own routable
    // section (TASK-123, mirroring the cea-block-<idx> pattern from TASK-114).
    ...displayId.section.blocks.map((block, index) => ({
      id: displayIdBlockSectionId(index),
      label: displayIdBlockLabel(block.tag),
      index,
    })),
  ]
})

function selectSection(id: string) {
  emit('update:activeSection', id)
}

// Each top-level group is independently collapsible; default expanded.
const edidOpen = ref(true)
const edidDescriptorsOpen = ref(true)
const ceaOpen = ref(true)
const ceaVsdbOpen = ref(true)
const ceaVcdbOpen = ref(true)
const ceaTimingsOpen = ref(true)
const displayIdOpen = ref(true)

/** Collapsible open-state per CTA block family callout. */
const ceaFamilyOpen: Record<CtaBlockFamily, Ref<boolean>> = {
  vsdb: ceaVsdbOpen,
  vcdb: ceaVcdbOpen,
}
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
                    :title="child.label"
                    @click="selectSection(child.id)"
                  >
                    <span class="truncate">{{ child.label }}</span>
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
                        class="flex-1 min-w-0 truncate text-left rounded-md px-1 py-0.5 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        :class="{ 'text-sidebar-accent-foreground font-semibold': isEdidDescriptorSection }"
                        title="Descriptors"
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
                              :title="child.label"
                              @click="selectSection(child.id)"
                            >
                              <span class="truncate">{{ child.label }}</span>
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
                              :title="child.label"
                              @click="selectSection(child.id)"
                            >
                              <span class="truncate">{{ child.label }}</span>
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
                <!-- One nav entry per encoded block in dataBlocks order
                     (TASK-114): Header & Flags, each data block at its
                     decoded position (VSDB / VCDB-family blocks collected
                     under collapsible callouts), Detailed Timings last. -->
                <template v-for="node in ceaNavItems" :key="node.key">
                  <!-- Header & Flags: fixed, not removable -->
                  <SidebarMenuSubItem v-if="node.kind === 'header'">
                    <SidebarMenuSubButton
                      as="button"
                      class="w-full"
                      :is-active="activeSection === 'cea-header'"
                      title="Header & Flags"
                      @click="selectSection('cea-header')"
                    >
                      <span class="truncate">Header & Flags</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <!-- Flat data block entry with hover-reveal by-index remove -->
                  <SidebarMenuSubItem
                    v-else-if="node.kind === 'block'"
                    class="group/cea-child"
                  >
                    <div class="flex items-center">
                      <SidebarMenuSubButton
                        as="button"
                        class="flex-1"
                        :is-active="activeSection === node.child.id"
                        :title="node.child.label"
                        @click="selectSection(node.child.id)"
                      >
                        <span class="truncate">{{ node.child.label }}</span>
                      </SidebarMenuSubButton>
                      <button
                        class="text-destructive hover:text-destructive/80 h-5 w-5 flex items-center justify-center shrink-0 text-xs opacity-0 group-hover/cea-child:opacity-100 focus:opacity-100 transition-opacity"
                        :title="`Remove ${node.child.label}`"
                        @click.stop="emit('removeCeaBlockByIndex', node.child.index)"
                      >
                        <X class="size-3" />
                      </button>
                    </div>
                  </SidebarMenuSubItem>

                  <!-- Family sub-group callout (VSDBs / VCDB family): the
                       header is a pure callout (collapse toggle, no section);
                       each child is one block with by-index remove. -->
                  <SidebarMenuSubItem v-else-if="node.kind === 'family'">
                    <Collapsible v-model:open="ceaFamilyOpen[node.family].value">
                      <CollapsibleTrigger
                        class="flex w-full items-center gap-1 rounded-md text-left hover:bg-sidebar-accent"
                        :aria-label="ceaFamilyOpen[node.family].value ? `Collapse ${node.label}` : `Expand ${node.label}`"
                      >
                        <span class="flex h-7 w-5 shrink-0 items-center justify-center text-sidebar-foreground/60">
                          <ChevronRight class="size-3.5 transition-transform" :class="{ 'rotate-90': ceaFamilyOpen[node.family].value }" />
                        </span>
                        <span
                          class="flex-1 min-w-0 truncate rounded-md px-1 py-0.5 text-xs font-medium text-muted-foreground"
                          :class="{ 'text-sidebar-accent-foreground font-semibold': activeCeaBlockFamily === node.family }"
                          :title="node.label"
                        >
                          {{ node.label }}
                        </span>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem
                            v-for="child in node.children"
                            :key="child.id"
                            class="group/cea-vendor-child"
                          >
                            <div class="flex items-center">
                              <SidebarMenuSubButton
                                as="button"
                                class="flex-1"
                                :is-active="activeSection === child.id"
                                :title="child.label"
                                @click="selectSection(child.id)"
                              >
                                <span class="truncate">{{ child.label }}</span>
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

                  <!-- Detailed Timings sub-group (TASK-112): always the last
                       entry — per CTA-861-G Table 53 the DTDs follow the
                       entire Data Block Collection. The header opens the
                       combined timings view; each child is one DTD with its
                       own per-child section and by-index remove; the Add
                       Timing action lives inside the group. -->
                  <SidebarMenuSubItem v-else-if="node.kind === 'timings'">
                    <Collapsible v-model:open="ceaTimingsOpen">
                      <div class="flex items-center gap-1">
                        <CollapsibleTrigger
                          class="flex h-7 w-5 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          :aria-label="ceaTimingsOpen ? 'Collapse detailed timings' : 'Expand detailed timings'"
                        >
                          <ChevronRight class="size-3.5 transition-transform" :class="{ 'rotate-90': ceaTimingsOpen }" />
                        </CollapsibleTrigger>
                        <button
                          class="flex-1 min-w-0 truncate text-left rounded-md px-1 py-0.5 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          :class="{ 'text-sidebar-accent-foreground font-semibold': isCeaTimingSection }"
                          title="Detailed Timings"
                          @click="selectSection('cea-timings')"
                        >
                          Detailed Timings
                        </button>
                      </div>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem
                            v-for="child in ceaTimingChildren"
                            :key="child.id"
                            class="group/cea-timing-child"
                          >
                            <div class="flex items-center">
                              <SidebarMenuSubButton
                                as="button"
                                class="flex-1"
                                :is-active="activeSection === child.id"
                                :title="child.label"
                                @click="selectSection(child.id)"
                              >
                                <span class="truncate">{{ child.label }}</span>
                              </SidebarMenuSubButton>
                              <button
                                class="text-destructive hover:text-destructive/80 h-5 w-5 flex items-center justify-center shrink-0 text-xs opacity-0 group-hover/cea-timing-child:opacity-100 focus:opacity-100 transition-opacity"
                                :title="`Remove ${child.label}`"
                                @click.stop="emit('removeCeaTimingByIndex', child.index)"
                              >
                                <X class="size-3" />
                              </button>
                            </div>
                          </SidebarMenuSubItem>
                          <!-- Adds a default 1080p60 standard-CVT DTD; pick a
                               different preset from inside the timing card's
                               Preset row. Disabled (with the reason as hover
                               hint) when the payload area shared with the
                               data blocks can't hold another 18-byte DTD
                               (TASK-110). -->
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
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuSubItem>
                </template>

                <!-- Add data block: options in the canonical order (TASK-114)
                     with the VSDB and VCDB families as cascading sub-menus at
                     their canonical positions (TASK-117). Short blocks are
                     deduped (single-instance) and VSDBs are always offered
                     (multiple legal, TASK-109). Options whose default block
                     would not fit the remaining payload area render disabled
                     with a "(no space)" suffix and hover reason instead of
                     silently vanishing (TASK-110). -->
                <SidebarMenuSubItem v-if="addBlockMenu.length > 0">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="sm" class="w-full text-xs text-muted-foreground h-7">
                        + Add Block
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <template v-for="node in addBlockMenu" :key="node.key">
                        <DropdownMenuItem
                          v-if="node.kind === 'item'"
                          :disabled="!node.option.fits"
                          :title="node.option.fits ? undefined : node.option.noSpaceTitle"
                          @click="emit('addCeaBlock', node.option.type)"
                        >
                          {{ node.option.label }}{{ node.option.fits ? '' : ' (no space)' }}
                        </DropdownMenuItem>
                        <DropdownMenuSub v-else>
                          <DropdownMenuSubTrigger>{{ node.label }}</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem
                              v-for="opt in node.options"
                              :key="opt.type"
                              :disabled="!opt.fits"
                              :title="opt.fits ? undefined : opt.noSpaceTitle"
                              @click="emit('addCeaBlock', opt.type)"
                            >
                              {{ opt.label }}{{ opt.fits ? '' : ' (no space)' }}
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
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
                      :title="child.label"
                      @click="selectSection(child.id)"
                    >
                      <span class="truncate">{{ child.label }}</span>
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