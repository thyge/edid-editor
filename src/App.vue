<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  DisplayIdDataBlockTag,
  createDefaultDisplayIdBlock,
  createDefaultDescriptor,
  createDefaultCEADataBlock,
  getCEAExtension,
  getDisplayIdExtension,
  type CEADefaultBlockType,
  type DisplayDescriptor,
  type CEAExtension,
  type DisplayIdDataBlock,
  type DisplayIdExtension,
} from 'edidts'
import { appendArrayItem, updateArrayItem, removeArrayItem } from '@/components/common/editorUtils'
import {
  generateTimingFromPreset,
  getTimingEditorState,
} from '@/composables/useTimingEditorState'
import TopNav from '@/components/layout/TopNav.vue'
import LeftNav from '@/components/layout/LeftNav.vue'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import HexViewer from '@/components/layout/HexViewer.vue'
import EDIDUpload from '@/components/edid/EDIDUpload.vue'
import EDIDOverviewSummary from '@/components/edid/EDIDOverviewSummary.vue'
import EDIDDisplayInfo from '@/components/edid/EDIDDisplayInfo.vue'
import EDIDColorCharacteristics from '@/components/edid/EDIDColorCharacteristics.vue'
import EDIDEstablishedTimings from '@/components/edid/EDIDEstablishedTimings.vue'
import EDIDStandardTimings from '@/components/edid/EDIDStandardTimings.vue'
import EDIDDetailedDescriptors from '@/components/edid/EDIDDetailedDescriptors.vue'
import CTAOverview from '@/components/cta/CTAOverview.vue'
import CTAHeaderFlags from '@/components/cta/CTAHeaderFlags.vue'
import CTAVideoBlock from '@/components/cta/CTAVideoBlock.vue'
import CTAAudioBlock from '@/components/cta/CTAAudioBlock.vue'
import CTASpeakerBlock from '@/components/cta/CTASpeakerBlock.vue'
import CTAVendorBlock from '@/components/cta/CTAVendorBlock.vue'
import CTAHDRColorimetry from '@/components/cta/CTAHDRColorimetry.vue'
import CTAVideoCapability from '@/components/cta/CTAVideoCapability.vue'
import CTADetailedTimings from '@/components/cta/CTADetailedTimings.vue'
import CTAVideoFormatPreference from '@/components/cta/CTAVideoFormatPreference.vue'
import CTAVendorAudioBlock from '@/components/cta/CTAVendorAudioBlock.vue'
import CTARoomConfiguration from '@/components/cta/CTARoomConfiguration.vue'
import CTASpeakerLocation from '@/components/cta/CTASpeakerLocation.vue'
import CTAInfoFrame from '@/components/cta/CTAInfoFrame.vue'
import CTAVesaTransferCharacteristic from '@/components/cta/CTAVesaTransferCharacteristic.vue'
import { useEDID } from '@/composables/useEDID'
import { computeHexBlockRegions, type HexRegion } from '@/composables/useHexBlockRegions'
import { displayIdSectionIds, displayIdBlockSectionByTag } from '@/components/displayid/displayIdLabels'
import DisplayIDOverview from '@/components/displayid/DisplayIDOverview.vue'
import DisplayIDHeader from '@/components/displayid/DisplayIDHeader.vue'
import DisplayIDProductIdentification from '@/components/displayid/DisplayIDProductIdentification.vue'
import DisplayIDDisplayParameters from '@/components/displayid/DisplayIDDisplayParameters.vue'
import DisplayIDTypeVIITimings from '@/components/displayid/DisplayIDTypeVIITimings.vue'
import DisplayIDTypeVIIIEnumerated from '@/components/displayid/DisplayIDTypeVIIIEnumerated.vue'
import DisplayIDTypeIXFormula from '@/components/displayid/DisplayIDTypeIXFormula.vue'
import DisplayIDDynamicRange from '@/components/displayid/DisplayIDDynamicRange.vue'
import DisplayIDInterfaceFeatures from '@/components/displayid/DisplayIDInterfaceFeatures.vue'
import DisplayIDStereoInterface from '@/components/displayid/DisplayIDStereoInterface.vue'
import DisplayIDTiledTopology from '@/components/displayid/DisplayIDTiledTopology.vue'
import DisplayIDContainerId from '@/components/displayid/DisplayIDContainerId.vue'
import DisplayIDVendorSpecific from '@/components/displayid/DisplayIDVendorSpecific.vue'
import DisplayIDCTA from '@/components/displayid/DisplayIDCTA.vue'

const edidStore = useEDID()
const edidRef = edidStore.edid
const { edidData, error, isLoaded, loadFromHex, loadFromFile, createBlankEdid } = edidStore

onMounted(() => {
  loadFromHex(
    "00,FF,FF,FF,FF,FF,FF,00,34,A9,1C,D1,01,01,01,01," +
    "00,19,01,03,80,DD,7D,78,0A,06,12,AF,51,4E,AD,24," +
    "0B,4C,51,20,08,00,A9,C0,A9,40,90,40,01,01,01,01," +
    "01,01,01,01,01,01,08,E8,00,30,F2,70,5A,80,B0,58," +
    "8A,00,1C,00,74,00,00,1E,02,3A,80,18,71,38,2D,40," +
    "58,2C,45,00,1C,00,74,00,00,1E,00,00,00,FC,00,45," +
    "54,2D,4D,44,4E,48,4D,31,30,0A,20,20,00,00,00,FD," +
    "00,17,79,0F,96,3C,00,0A,20,20,20,20,20,20,01,75," +
    "02,03,41,B1,57,61,60,5F,5E,5D,66,65,64,63,62,3F," +
    "10,1F,05,14,22,21,20,04,13,02,11,01,E3,05,E0,00," +
    "6E,03,0C,00,10,00,38,3C,20,08,80,01,02,03,04,67," +
    "D8,5D,C4,01,78,80,03,E2,00,FF,E2,0F,63,E3,06,0D," +
    "01,28,3C,80,A0,70,B0,23,40,30,20,36,00,66,00,64," +
    "00,00,1A,00,00,00,00,00,00,00,00,00,00,00,00,00," +
    "00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,00," +
    "00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,5A"
  )
})

const activeSection = ref('overview')

/**
 * App-wide drag-and-drop for EDID files: dropping a file anywhere on the window
 * loads it via the same `loadFromFile` path as the TopNav file picker (so it
 * works whether or not an EDID is already loaded). A drag counter tolerates
 * nested dragenter/dragleave events; only file drags are intercepted (text/plain
 * hex drops are ignored here — the EDIDUpload card handles those via paste).
 */
const isDragging = ref(false)
const dragDepth = ref(0)

function hasFiles(e: DragEvent): boolean {
  return Array.from(e.dataTransfer?.types ?? []).includes('Files')
}
function onDragEnter(e: DragEvent): void {
  if (!hasFiles(e)) return
  e.preventDefault()
  dragDepth.value++
  isDragging.value = true
}
function onDragOver(e: DragEvent): void {
  if (!hasFiles(e)) return
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'copy'
  isDragging.value = true
}
function onDragLeave(e: DragEvent): void {
  if (!hasFiles(e)) return
  dragDepth.value = Math.max(0, dragDepth.value - 1)
  if (dragDepth.value === 0) isDragging.value = false
}
function onDrop(e: DragEvent): void {
  if (!hasFiles(e)) return
  e.preventDefault()
  dragDepth.value = 0
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) loadFromFile(file)
}

/**
 * Add a detailed timing to the EDID base block, generated from a CVT preset
 * (default 1080p60 standard CVT — matching the EDID constructor's first
 * descriptor baseline). After appending, the new DTD's editor authoring mode
 * is pre-set to the preset's CVT variant (and the CVT refresh-rate input to the
 * preset's rate) so the card opens with field locking already applied — the
 * WeakMap-keyed state must be seeded against the reactive proxy that
 * `detailedTimings` exposes after the array reassign, not the raw instance.
 */
function addTiming(presetKey?: string) {
  if (!edidRef.value) return
  const { timing, mode, refreshRate } = generateTimingFromPreset(presetKey)
  const timings = appendArrayItem(edidRef.value.base.detailedTimings, timing)
  edidRef.value.base.detailedTimings = timings
  const proxy = edidRef.value.base.detailedTimings[timings.length - 1]
  const state = getTimingEditorState(proxy)
  state.mode = mode
  state.refreshRate = refreshRate
  activeSection.value = `edid-dtd-${timings.length - 1}`
}

/** Add a CTA-861 detailed timing via the same CVT-preset flow (TASK-87 AC #4). */
function addCeaTiming(presetKey?: string) {
  if (!edidRef.value) return
  const cea = getCEAExtension(edidRef.value)
  if (!cea) return
  const { timing, mode, refreshRate } = generateTimingFromPreset(presetKey)
  const ceaTiming = { ...timing, isNative: false }
  const timings = appendArrayItem(cea.detailedTimings, ceaTiming)
  cea.detailedTimings = timings
  const proxy = cea.detailedTimings[timings.length - 1]
  const state = getTimingEditorState(proxy)
  state.mode = mode
  state.refreshRate = refreshRate
  activeSection.value = 'cea-timings'
}

function removeTiming(index: number) {
  if (!edidRef.value) return
  edidRef.value.base.detailedTimings = removeArrayItem(edidRef.value.base.detailedTimings, index)
  if (activeSection.value.startsWith('edid-dtd-')) activeSection.value = 'overview'
}

function addDescriptor(tag: number) {
  if (!edidRef.value) return
  const descriptor = createDefaultDescriptor(tag)
  const descriptors = appendArrayItem(edidRef.value.base.displayDescriptors, descriptor)
  edidRef.value.base.displayDescriptors = descriptors
  activeSection.value = `edid-desc-${descriptors.length - 1}`
}

function removeDescriptor(index: number) {
  if (!edidRef.value) return
  const meaningful = removeArrayItem(
    edidRef.value.base.displayDescriptors.filter(d => d.tag !== 0x10),
    index,
  )
  const dummies = edidRef.value.base.displayDescriptors.filter(d => d.tag === 0x10)
  edidRef.value.base.displayDescriptors = [...meaningful, ...dummies]
  if (activeSection.value.startsWith('edid-desc-')) activeSection.value = 'overview'
}

function updateDescriptor(index: number, descriptor: DisplayDescriptor) {
  if (!edidRef.value) return
  const descriptors = edidRef.value.base.displayDescriptors
  if (index < 0 || index >= descriptors.length) return
  edidRef.value.base.displayDescriptors = updateArrayItem(descriptors, index, descriptor)
}

/** Set a (possibly dotted) path on a reactive prop-root, mutating in place.
 *  The EEDID tree is wrapped in `reactive()`, so a deep property set is
 *  tracked and the `edidData` computed (whose only expression is
 *  `EEDID.encode(edid.value)`) lazily re-encodes on the next render — no manual
 *  encode call site. No-ops on a nullish target or an unresolved intermediate.
 *
 *  After the in-place set, the OUTERMOST array ancestor in the path is
 *  reassigned (a shallow copy). This is defensive: reactive() deep-tracks
 *  nested property sets, but reassigning the enclosing array also covers
 *  shallowRef-wrapped roots and matches the TASK-76 contract (array-element
 *  edits reassign the array). The encode is pure, so re-reading the copied
 *  array (same element refs, mutated in place) reproduces identical bytes. */
function setByPath(root: object | undefined | null, path: string, value: unknown): void {
  if (!root) return
  const parts = path.split('.')
  const containers: { container: object; key: string }[] = []
  let cur: object = root
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i]
    containers.push({ container: cur, key })
    if (i === parts.length - 1) {
      ;(cur as Record<string, unknown>)[key] = value
      break
    }
    const next = (cur as Record<string, unknown>)[key]
    if (next == null || typeof next !== 'object') return
    cur = next
  }
  for (const { container, key } of containers) {
    const slot = (container as Record<string, unknown>)[key]
    if (Array.isArray(slot)) {
      ;(container as Record<string, unknown>)[key] = [...(slot as unknown[])]
      break
    }
  }
}

/** One setByPath per prop-root (TASK-76): every EDID-base field edit lands as a
 *  prop-relative dotted path rooted at the base block. */
const setEdidField = (path: string, value: unknown) => setByPath(edidRef.value?.base, path, value)

const ceaExtension = computed(() => edidRef.value ? getCEAExtension(edidRef.value) : null)
const displayIdExtension = computed(() => edidRef.value ? getDisplayIdExtension(edidRef.value) : null)
/** Per-data-block regions for the HexViewer dividers (offset + label + depth),
 *  tiled over the full re-encoded blob. Derived from the same reactive EEDID
 *  tree that `edidData` encodes from, so it stays in sync with edits. */
const hexRegions = computed<HexRegion[]>(() => (edidRef.value ? computeHexBlockRegions(edidRef.value) : []))

function addCEAExtension() {
  if (!edidRef.value) return
  const blankCEA: CEAExtension = {
    tag: 0x02,
    revision: 3,
    checksum: 0,
    data: new Uint8Array(125),
    dtdOffset: 4,
    underscan: false,
    basicAudio: false,
    ycbcr444: false,
    ycbcr422: false,
    nativeFormats: 0,
    dataBlocks: [],
    detailedTimings: [],
  }
  edidRef.value.extensions = appendArrayItem(edidRef.value.extensions, blankCEA)
  activeSection.value = 'cea-overview'
}

function removeCEAExtension() {
  if (!edidRef.value) return
  edidRef.value.extensions = edidRef.value.extensions.filter(b => b.tag !== 0x02)
  if (activeSection.value.startsWith('cea-')) {
    activeSection.value = 'overview'
  }
}

function addCEADataBlock(blockType: string) {
  if (!edidRef.value) return
  const cea = getCEAExtension(edidRef.value)
  if (!cea) return
  const block = createDefaultCEADataBlock(blockType as CEADefaultBlockType)
  if (!block) return
  cea.dataBlocks = appendArrayItem(cea.dataBlocks, block)
  const section = ceaBlockActiveSection[blockType]
  if (section) activeSection.value = section
}

/** Maps a CEA default-block type to the editor section shown after adding it. */
const ceaBlockActiveSection: Record<string, string> = {
  'video': 'cea-video',
  'audio': 'cea-audio',
  'speakers': 'cea-speakers',
  'video-capability': 'cea-video-cap',
  'colorimetry': 'cea-hdr-color',
  'hdr-static': 'cea-hdr-color',
  'video-format-preference': 'cea-video-format-pref',
  'vendor-audio': 'cea-vendor-audio',
  'room-config': 'cea-room-config',
  'speaker-location': 'cea-speaker-location',
  'infoframe': 'cea-infoframe',
  'vesa-transfer': 'cea-vesa-transfer',
}

function removeCEADataBlock(blockTag: number, extendedTag?: number) {
  if (!edidRef.value) return
  const cea = getCEAExtension(edidRef.value)
  if (!cea) return
  if (extendedTag !== undefined) {
    cea.dataBlocks = cea.dataBlocks.filter(b =>
      !(b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === extendedTag)
    )
  } else {
    const idx = cea.dataBlocks.findIndex(b => b.tag === blockTag)
    if (idx !== -1) cea.dataBlocks = removeArrayItem(cea.dataBlocks, idx)
  }
  if (activeSection.value.startsWith('cea-')) {
    activeSection.value = 'cea-overview'
  }
}

function addDisplayIdExtension() {
  if (!edidRef.value) return
  const displayId: DisplayIdExtension = {
    kind: 'displayid',
    tag: 0x70,
    revision: 0,
    checksum: 0,
    section: {
      version: 2,
      revision: 0,
      versionByte: 0x20,
      bytesInSection: 0,
      totalLength: 5,
      primaryUseCase: 0x04,
      extensionCount: 0,
      blocks: [],
      fillBytes: 0,
      checksum: 0,
      isChecksumValid: true,
    },
  }
  edidRef.value.extensions = appendArrayItem(edidRef.value.extensions, displayId)
  activeSection.value = displayIdSectionIds.overview
}

function removeDisplayIdExtension() {
  if (!edidRef.value) return
  edidRef.value.extensions = edidRef.value.extensions.filter(b => b.tag !== 0x70)
  if (activeSection.value.startsWith('displayid-')) {
    activeSection.value = 'overview'
  }
}

function addDisplayIdBlock(tag: number) {
  const displayId = displayIdExtension.value
  if (!displayId) return
  displayId.section.blocks = appendArrayItem(displayId.section.blocks, createDefaultDisplayIdBlock(tag as DisplayIdDataBlockTag))
  activeSection.value = displayIdBlockSectionByTag[tag] ?? displayIdSectionIds.overview
}

function removeDisplayIdBlock(index: number) {
  const displayId = displayIdExtension.value
  if (!displayId) return
  displayId.section.blocks = removeArrayItem(displayId.section.blocks, index)
}

function moveDisplayIdBlock(index: number, direction: -1 | 1) {
  const displayId = displayIdExtension.value
  if (!displayId) return
  const blocks = displayId.section.blocks
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= blocks.length) return
  const [block] = blocks.splice(index, 1)
  blocks.splice(nextIndex, 0, block)
}

function updateDisplayIdBlock(index: number, block: DisplayIdDataBlock) {
  const displayId = displayIdExtension.value
  if (!displayId) return
  displayId.section.blocks = updateArrayItem(displayId.section.blocks, index, block)
}

/** One setByPath per prop-root (TASK-76): every CTA field edit lands as a
 *  prop-relative dotted path rooted at the CEA extension (e.g. "revision",
 *  "dataBlocks.1.vics", "detailedTimings.0.flags.interlaced"). */
const setCeaField = (path: string, value: unknown) => setByPath(ceaExtension.value, path, value)

/** One setByPath per prop-root (TASK-76): every DisplayID section-level edit
 *  lands as a prop-relative dotted path rooted at the DisplayID section. */
const setDisplayIdField = (path: string, value: unknown) => setByPath(displayIdExtension.value?.section, path, value)
</script>

<template>
  <div
    class="h-screen flex flex-col bg-background text-foreground relative"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Full-window drop overlay for EDID files (pointer-events-none so the drop
         still lands on the root handler). -->
    <div
      v-if="isDragging"
      class="fixed inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm pointer-events-none"
    >
      <div class="rounded-xl border-2 border-dashed border-primary bg-background/80 px-8 py-6 text-center shadow-lg">
        <p class="text-lg font-semibold text-primary">Drop EDID file to load</p>
        <p class="text-sm text-muted-foreground">.bin, .edid, .raw, .dat, or .txt (hex)</p>
      </div>
    </div>
    <TopNav
      @import-file="loadFromFile"
      @load-hex="loadFromHex"
      @new-edid="createBlankEdid"
    />
    <SidebarProvider class="flex-1 min-h-0 overflow-hidden">
      <LeftNav
        :edid="edidRef"
        v-model:active-section="activeSection"
        @add-edid-timing="(k?: string) => addTiming(k)"
        @remove-edid-timing="removeTiming"
        @add-edid-descriptor="addDescriptor"
        @remove-edid-descriptor="removeDescriptor"
        @add-cea="addCEAExtension"
        @remove-cea="removeCEAExtension"
        @add-cea-block="addCEADataBlock"
        @remove-cea-block="removeCEADataBlock"
        @add-cea-timing="(k?: string) => addCeaTiming(k)"
        @add-display-id="addDisplayIdExtension"
        @remove-display-id="removeDisplayIdExtension"
        @add-display-id-block="addDisplayIdBlock"
        @remove-display-id-block="removeDisplayIdBlock"
        @move-display-id-block="moveDisplayIdBlock"
      />
      <SidebarInset class="p-4 overflow-auto">
        <div v-if="error" class="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
          {{ error }}
        </div>

        <div v-if="!isLoaded" class="max-w-xl mx-auto">
          <EDIDUpload @load-hex="loadFromHex" @load-file="loadFromFile" />
        </div>

        <div v-else class="max-w-4xl">
          <EDIDOverviewSummary v-if="activeSection === 'overview'" :edid="edidRef!" />
          <EDIDDisplayInfo v-else-if="activeSection === 'display-info'" :edid="edidRef!" @update="setEdidField" />
          <EDIDColorCharacteristics v-else-if="activeSection === 'color-gamut'" :edid="edidRef!" @update="setEdidField" />
          <EDIDEstablishedTimings
            v-else-if="activeSection === 'timings-established'"
            :edid="edidRef!"
            @update="setEdidField"
          />
          <EDIDStandardTimings
            v-else-if="activeSection === 'timings-standard'"
            :edid="edidRef!"
            @update="setEdidField"
          />
          <EDIDDetailedDescriptors
            v-else-if="activeSection === 'edid-descriptors' || activeSection.startsWith('edid-dtd-') || activeSection.startsWith('edid-desc-')"
            :edid="edidRef!"
            :focus="activeSection"
            @update="setEdidField"
            @update-descriptor="updateDescriptor"
          />

          <!-- CEA sections -->
          <CTAOverview v-else-if="activeSection === 'cea-overview' && ceaExtension" :cea="ceaExtension" @update="setCeaField" />
          <CTAHeaderFlags v-else-if="activeSection === 'cea-header' && ceaExtension" :cea="ceaExtension" @update="setCeaField" />
          <CTAVideoBlock v-else-if="activeSection === 'cea-video' && ceaExtension" :cea="ceaExtension" @update="setCeaField" />
          <CTAAudioBlock v-else-if="activeSection === 'cea-audio' && ceaExtension" :cea="ceaExtension" @update="setCeaField" />
          <CTASpeakerBlock v-else-if="activeSection === 'cea-speakers' && ceaExtension" :cea="ceaExtension" @update="setCeaField" />
          <CTAVendorBlock v-else-if="activeSection === 'cea-vendor' && ceaExtension" :cea="ceaExtension" @update="setCeaField" />
          <CTAHDRColorimetry v-else-if="activeSection === 'cea-hdr-color' && ceaExtension" :cea="ceaExtension" @update="setCeaField" />
          <CTAVideoCapability v-else-if="activeSection === 'cea-video-cap' && ceaExtension" :cea="ceaExtension" @update="setCeaField" />
          <CTAVideoFormatPreference v-else-if="activeSection === 'cea-video-format-pref' && ceaExtension" :cea="ceaExtension" @update="setCeaField" />
          <CTAVendorAudioBlock v-else-if="activeSection === 'cea-vendor-audio' && ceaExtension" :cea="ceaExtension" @update="setCeaField" />
          <CTARoomConfiguration v-else-if="activeSection === 'cea-room-config' && ceaExtension" :cea="ceaExtension" @update="setCeaField" />
          <CTASpeakerLocation v-else-if="activeSection === 'cea-speaker-location' && ceaExtension" :cea="ceaExtension" @update="setCeaField" />
          <CTAInfoFrame v-else-if="activeSection === 'cea-infoframe' && ceaExtension" :cea="ceaExtension" @update="setCeaField" />
          <CTAVesaTransferCharacteristic v-else-if="activeSection === 'cea-vesa-transfer' && ceaExtension" :cea="ceaExtension" @update="setCeaField" />
          <CTADetailedTimings
            v-else-if="activeSection === 'cea-timings' && ceaExtension"
            :cea="ceaExtension"
            @update="setCeaField"
          />

          <DisplayIDOverview
            v-else-if="activeSection === displayIdSectionIds.overview && displayIdExtension"
            :display-id="displayIdExtension"
            @remove-block="removeDisplayIdBlock"
            @move-block="moveDisplayIdBlock"
          />
          <DisplayIDHeader
            v-else-if="activeSection === displayIdSectionIds.header && displayIdExtension"
            :display-id="displayIdExtension"
            @update="setDisplayIdField"
          />
          <DisplayIDProductIdentification
            v-else-if="activeSection === displayIdSectionIds.product && displayIdExtension"
            :display-id="displayIdExtension"
            @update-block="updateDisplayIdBlock"
          />
          <DisplayIDDisplayParameters
            v-else-if="activeSection === displayIdSectionIds.parameters && displayIdExtension"
            :display-id="displayIdExtension"
            @update-block="updateDisplayIdBlock"
          />
          <DisplayIDTypeVIITimings
            v-else-if="activeSection === displayIdSectionIds.typeVII && displayIdExtension"
            :display-id="displayIdExtension"
            @update-block="updateDisplayIdBlock"
          />
          <DisplayIDTypeVIIIEnumerated
            v-else-if="activeSection === displayIdSectionIds.typeVIII && displayIdExtension"
            :display-id="displayIdExtension"
            @update-block="updateDisplayIdBlock"
          />
          <DisplayIDTypeIXFormula
            v-else-if="activeSection === displayIdSectionIds.typeIX && displayIdExtension"
            :display-id="displayIdExtension"
            @update-block="updateDisplayIdBlock"
          />
          <DisplayIDDynamicRange
            v-else-if="activeSection === displayIdSectionIds.dynamicRange && displayIdExtension"
            :display-id="displayIdExtension"
            @update-block="updateDisplayIdBlock"
          />
          <DisplayIDInterfaceFeatures
            v-else-if="activeSection === displayIdSectionIds.interfaceFeatures && displayIdExtension"
            :display-id="displayIdExtension"
            @update-block="updateDisplayIdBlock"
          />
          <DisplayIDStereoInterface
            v-else-if="activeSection === displayIdSectionIds.stereo && displayIdExtension"
            :display-id="displayIdExtension"
            @update-block="updateDisplayIdBlock"
          />
          <DisplayIDTiledTopology
            v-else-if="activeSection === displayIdSectionIds.tiled && displayIdExtension"
            :display-id="displayIdExtension"
            @update-block="updateDisplayIdBlock"
          />
          <DisplayIDContainerId
            v-else-if="activeSection === displayIdSectionIds.container && displayIdExtension"
            :display-id="displayIdExtension"
            @update-block="updateDisplayIdBlock"
          />
          <DisplayIDVendorSpecific
            v-else-if="activeSection === displayIdSectionIds.vendor && displayIdExtension"
            :display-id="displayIdExtension"
            @update-block="updateDisplayIdBlock"
          />
          <DisplayIDCTA
            v-else-if="activeSection === displayIdSectionIds.cta && displayIdExtension"
            :display-id="displayIdExtension"
            @update-block="updateDisplayIdBlock"
          />
        </div>
      </SidebarInset>
      <section id="hex-viewer" class="h-full scroll-mt-24">
        <HexViewer :data="edidData" :regions="hexRegions" />
      </section>
    </SidebarProvider>
  </div>
</template>
