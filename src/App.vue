<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  DetailedTimingDescriptor,
  DisplayIdDataBlockTag,
  createDefaultDisplayIdBlock,
  createDefaultDescriptor,
  createDefaultCEADataBlock,
  getCEAExtension,
  getDisplayIdExtension,
  type CEADefaultBlockType,
  type DisplayDescriptor,
  type ScreenSize,
  type VideoInputDefinition,
  type EstablishedTiming,
  type StandardTiming,
  type CEAExtension,
  type DisplayIdDataBlock,
  type DisplayIdExtension,
  type VendorSpecificDataBlock,
  type VendorSpecificVideoDataBlock,
} from 'edidts'
import TopNav from '@/components/layout/TopNav.vue'
import LeftNav from '@/components/layout/LeftNav.vue'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import HexViewer from '@/components/layout/HexViewer.vue'
import EDIDUpload from '@/components/edid/EDIDUpload.vue'
import OverviewSummary from '@/components/edid/OverviewSummary.vue'
import DisplayInfo from '@/components/edid/DisplayInfo.vue'
import ColorCharacteristics from '@/components/edid/ColorCharacteristics.vue'
import EstablishedTimings from '@/components/edid/EstablishedTimings.vue'
import StandardTimings from '@/components/edid/StandardTimings.vue'
import DetailedDescriptors from '@/components/edid/DetailedDescriptors.vue'
import CEAOverview from '@/components/cea/CEAOverview.vue'
import CEAHeaderFlags from '@/components/cea/CEAHeaderFlags.vue'
import CEAVideoBlock from '@/components/cea/CEAVideoBlock.vue'
import CEAAudioBlock from '@/components/cea/CEAAudioBlock.vue'
import CEASpeakerBlock from '@/components/cea/CEASpeakerBlock.vue'
import CEAVendorBlock from '@/components/cea/CEAVendorBlock.vue'
import CEAHDRColorimetry from '@/components/cea/CEAHDRColorimetry.vue'
import CEAVideoCapability from '@/components/cea/CEAVideoCapability.vue'
import CEADetailedTimings from '@/components/cea/CEADetailedTimings.vue'
import CEAVideoFormatPreference from '@/components/cea/CEAVideoFormatPreference.vue'
import CEAVendorAudioBlock from '@/components/cea/CEAVendorAudioBlock.vue'
import CEARoomConfiguration from '@/components/cea/CEARoomConfiguration.vue'
import CEASpeakerLocation from '@/components/cea/CEASpeakerLocation.vue'
import CEAInfoFrame from '@/components/cea/CEAInfoFrame.vue'
import CEAVesaTransferCharacteristic from '@/components/cea/CEAVesaTransferCharacteristic.vue'
import { useEDID } from '@/composables/useEDID'
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

function addTiming() {
  if (!edidRef.value) return
  const timings = [...edidRef.value.base.detailedTimings, new DetailedTimingDescriptor()]
  edidRef.value.base.detailedTimings = timings
  activeSection.value = `edid-dtd-${timings.length - 1}`
}

function removeTiming(index: number) {
  if (!edidRef.value) return
  edidRef.value.base.detailedTimings = edidRef.value.base.detailedTimings.filter((_, i) => i !== index)
  if (activeSection.value.startsWith('edid-dtd-')) activeSection.value = 'overview'
}

function updateDetailedTiming(index: number, field: string, value: unknown) {
  if (!edidRef.value) return
  const timings = edidRef.value.base.detailedTimings
  const timing = timings[index]
  if (!timing) return
  if (field.startsWith('flags.')) {
    const key = field.slice(6)
    ;(timing.flags as unknown as Record<string, unknown>)[key] = value
  } else {
    ;(timing as unknown as Record<string, unknown>)[field] = value
  }
  // Reassign the array so Vue re-evaluates the detailedTimings computed and
  // the HexViewer reflects the re-encoded bytes.
  edidRef.value.base.detailedTimings = [...timings]
}

function addDescriptor(tag: number) {
  if (!edidRef.value) return
  const descriptor = createDefaultDescriptor(tag)
  const descriptors = [...edidRef.value.base.displayDescriptors, descriptor]
  edidRef.value.base.displayDescriptors = descriptors
  activeSection.value = `edid-desc-${descriptors.length - 1}`
}

function removeDescriptor(index: number) {
  if (!edidRef.value) return
  const meaningful = edidRef.value.base.displayDescriptors.filter(d => d.tag !== 0x10)
  meaningful.splice(index, 1)
  const dummies = edidRef.value.base.displayDescriptors.filter(d => d.tag === 0x10)
  edidRef.value.base.displayDescriptors = [...meaningful, ...dummies]
  if (activeSection.value.startsWith('edid-desc-')) activeSection.value = 'overview'
}

function updateDescriptor(index: number, descriptor: DisplayDescriptor) {
  if (!edidRef.value) return
  const descriptors = [...edidRef.value.base.displayDescriptors]
  if (index < 0 || index >= descriptors.length) return
  descriptors[index] = descriptor
  edidRef.value.base.displayDescriptors = descriptors
}

/** Set a (possibly dotted) path on an object, mutating in place. The EEDID
 *  tree is reactive, so this mutation is tracked and the deep watcher in
 *  useEDID re-encodes — no manual syncEdid/trigger needed. No-ops on a nullish
 *  target (carrier children emit `block | undefined`). */
function setByPath(obj: object | undefined | null, path: string, value: unknown): void {
  if (!obj) return
  const parts = path.split('.')
  let cur: Record<string, unknown> = obj as Record<string, unknown>
  for (let i = 0; i < parts.length - 1; i++) {
    const next = cur[parts[i]]
    if (next == null || typeof next !== 'object') return
    cur = next as Record<string, unknown>
  }
  cur[parts[parts.length - 1]] = value
}

/** Edit a structured vendor data block — tag-0x03 VSDBs (HDMI 1.4, HDMI
 *  Forum, Microsoft HMD, AMD) and tag-0x07 ext-0x01 VSVDBs (Dolby Vision).
 *  Both carrier families re-encode from block.vendor.fields; mutate the fields
 *  object and the reactive tree + deep watcher handle propagation. The
 *  VSDB/VSVDB split collapsed in TASK-67; trailing vendor-reserved bytes live
 *  in the decoded shape's `trailing` field and survive the vendor encoder. */
function applyVendorField(block: VendorSpecificDataBlock | VendorSpecificVideoDataBlock, field: string, value: unknown) {
  const vendor = block.vendor
  if (!vendor || vendor.kind === 'unknown') return
  setByPath(vendor.fields as object, field, value)
}

function updateDisplayInfo(field: string, value: unknown) {
  if (!edidRef.value) return
  const edid = edidRef.value.base

  if (field.startsWith('header.')) {
    const key = field.slice(7) as keyof typeof edid.header & string
    ;(edid.header as unknown as Record<string, unknown>)[key] = value
  } else if (field === 'videoInput') {
    edid.videoInput = value as VideoInputDefinition
  } else if (field === 'screenSize') {
    edid.screenSize = value as ScreenSize
  } else if (field === 'gamma') {
    edid.gamma = value as number
  } else if (field.startsWith('featureSupport.')) {
    const key = field.slice(15) as keyof typeof edid.featureSupport.features & string
    ;(edid.featureSupport.features as unknown as Record<string, unknown>)[key] = value
  }

}

function updateTimings(field: string, value: unknown) {
  if (!edidRef.value) return
  if (field === 'establishedTimings') {
    edidRef.value.base.establishedTimings = value as EstablishedTiming[]
  } else if (field === 'standardTimings') {
    edidRef.value.base.standardTimings = value as StandardTiming[]
  }
}

const ceaExtension = computed(() => edidRef.value ? getCEAExtension(edidRef.value) : null)
const displayIdExtension = computed(() => edidRef.value ? getDisplayIdExtension(edidRef.value) : null)

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
  edidRef.value.extensions = [...edidRef.value.extensions, blankCEA]
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
  cea.dataBlocks.push(block)
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
    if (idx !== -1) cea.dataBlocks.splice(idx, 1)
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
  edidRef.value.extensions = [...edidRef.value.extensions, displayId]
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
  displayId.section.blocks.push(createDefaultDisplayIdBlock(tag as DisplayIdDataBlockTag))
  activeSection.value = displayIdBlockSectionByTag[tag] ?? displayIdSectionIds.overview
}

function removeDisplayIdBlock(index: number) {
  const displayId = displayIdExtension.value
  if (!displayId) return
  displayId.section.blocks.splice(index, 1)
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

function updateDisplayId(field: string, value: unknown) {
  const displayId = displayIdExtension.value
  if (!displayId) return
  const section = displayId.section
  if (field === 'primaryUseCase') section.primaryUseCase = value as number
  if (field === 'extensionCount') section.extensionCount = value as number
}

function updateDisplayIdBlock(index: number, block: DisplayIdDataBlock) {
  const displayId = displayIdExtension.value
  if (!displayId) return
  displayId.section.blocks[index] = block
}

function updateCEA(field: string, value: unknown) {
  if (!edidRef.value) return
  const cea = getCEAExtension(edidRef.value)
  if (!cea) return

  if (field === 'revision') {
    cea.revision = value as number
  } else if (field === 'underscan' || field === 'basicAudio' || field === 'ycbcr444' || field === 'ycbcr422') {
    ;(cea as unknown as Record<string, unknown>)[field] = value
  } else if (field === 'nativeFormats') {
    cea.nativeFormats = value as number
  } else if (field === 'videoBlock.vics') {
    const vdb = cea.dataBlocks.find(b => b.tag === 0x02)
    if (vdb) {
      ;(vdb as unknown as Record<string, unknown>).vics = value
    }
  } else if (field === 'audioBlock.descriptors') {
    const adb = cea.dataBlocks.find(b => b.tag === 0x01)
    if (adb) {
      ;(adb as unknown as Record<string, unknown>).descriptors = value
    }
  } else if (field === 'speakerBlock.speakers') {
    const spk = cea.dataBlocks.find(b => b.tag === 0x04)
    if (spk) {
      ;(spk as unknown as Record<string, unknown>).speakers = value
    }
  } else if (field.startsWith('videoCapability.')) {
    const vcdb = cea.dataBlocks.find(
      b => b.tag === 0x07 && (b as { extendedTag?: number }).extendedTag === 0x00
    )
    if (vcdb) {
      const key = field.slice('videoCapability.'.length)
      ;(vcdb as unknown as Record<string, unknown>)[key] = value
    }
  } else if (field.startsWith('detailedTiming.')) {
    // "detailedTiming.<index>.<subfield>" — subfield is a dotted path such as
    // "pixelClock" or "flags.interlaced".
    const rest = field.slice('detailedTiming.'.length)
    const sep = rest.indexOf('.')
    const idx = Number(rest.slice(0, sep))
    const subfield = rest.slice(sep + 1)
    const timing = cea.detailedTimings[idx]
    if (timing) {
      if (subfield.startsWith('flags.')) {
        const key = subfield.slice(6)
        ;(timing.flags as unknown as Record<string, unknown>)[key] = value
      } else {
        ;(timing as unknown as Record<string, unknown>)[subfield] = value
      }
      cea.detailedTimings = [...cea.detailedTimings]
    }
  }

}
</script>

<template>
  <div class="h-screen flex flex-col bg-background text-foreground">
    <TopNav
      @import-file="loadFromFile"
      @load-hex="loadFromHex"
      @new-edid="createBlankEdid"
    />
    <SidebarProvider class="flex-1 min-h-0 overflow-hidden">
      <LeftNav
        :edid="edidRef"
        v-model:active-section="activeSection"
        @add-edid-timing="addTiming"
        @remove-edid-timing="removeTiming"
        @add-edid-descriptor="addDescriptor"
        @remove-edid-descriptor="removeDescriptor"
        @add-cea="addCEAExtension"
        @remove-cea="removeCEAExtension"
        @add-cea-block="addCEADataBlock"
        @remove-cea-block="removeCEADataBlock"
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
          <OverviewSummary v-if="activeSection === 'overview'" :edid="edidRef!" />
          <DisplayInfo v-else-if="activeSection === 'display-info'" :edid="edidRef!" @update="updateDisplayInfo" />
          <ColorCharacteristics v-else-if="activeSection === 'color-gamut'" :edid="edidRef!" />
          <EstablishedTimings
            v-else-if="activeSection === 'timings-established'"
            :edid="edidRef!"
            @update="updateTimings"
          />
          <StandardTimings
            v-else-if="activeSection === 'timings-standard'"
            :edid="edidRef!"
            @update="updateTimings"
          />
          <DetailedDescriptors
            v-else-if="activeSection === 'edid-descriptors' || activeSection.startsWith('edid-dtd-') || activeSection.startsWith('edid-desc-')"
            :edid="edidRef!"
            :focus="activeSection"
            @update-timing="updateDetailedTiming"
            @update-descriptor="updateDescriptor"
          />

          <!-- CEA sections -->
          <CEAOverview v-else-if="activeSection === 'cea-overview' && ceaExtension" :cea="ceaExtension" @update="updateCEA" />
          <CEAHeaderFlags v-else-if="activeSection === 'cea-header' && ceaExtension" :cea="ceaExtension" @update="updateCEA" />
          <CEAVideoBlock v-else-if="activeSection === 'cea-video' && ceaExtension" :cea="ceaExtension" @update="updateCEA" />
          <CEAAudioBlock v-else-if="activeSection === 'cea-audio' && ceaExtension" :cea="ceaExtension" @update="updateCEA" />
          <CEASpeakerBlock v-else-if="activeSection === 'cea-speakers' && ceaExtension" :cea="ceaExtension" @update="updateCEA" />
          <CEAVendorBlock v-else-if="activeSection === 'cea-vendor' && ceaExtension" :cea="ceaExtension" @update="(b, f, v) => applyVendorField(b, f, v)" @update-vsvdb="(b, f, v) => applyVendorField(b, f, v)" />
          <CEAHDRColorimetry v-else-if="activeSection === 'cea-hdr-color' && ceaExtension" :cea="ceaExtension" @update="(b, f, v) => setByPath(b, f, v)" />
          <CEAVideoCapability v-else-if="activeSection === 'cea-video-cap' && ceaExtension" :cea="ceaExtension" @update="updateCEA" />
          <CEAVideoFormatPreference v-else-if="activeSection === 'cea-video-format-pref' && ceaExtension" :cea="ceaExtension" @update="(b, f, v) => setByPath(b, f, v)" />
          <CEAVendorAudioBlock v-else-if="activeSection === 'cea-vendor-audio' && ceaExtension" :cea="ceaExtension" @update="(b, f, v) => setByPath(b, f, v)" />
          <CEARoomConfiguration v-else-if="activeSection === 'cea-room-config' && ceaExtension" :cea="ceaExtension" @update="(b, f, v) => setByPath(b, f, v)" />
          <CEASpeakerLocation v-else-if="activeSection === 'cea-speaker-location' && ceaExtension" :cea="ceaExtension" @update="(b, f, v) => setByPath(b, f, v)" />
          <CEAInfoFrame v-else-if="activeSection === 'cea-infoframe' && ceaExtension" :cea="ceaExtension" @update="(b, f, v) => setByPath(b, f, v)" />
          <CEAVesaTransferCharacteristic v-else-if="activeSection === 'cea-vesa-transfer' && ceaExtension" :cea="ceaExtension" @update="(b, f, v) => setByPath(b, f, v)" />
          <CEADetailedTimings
            v-else-if="activeSection === 'cea-timings' && ceaExtension"
            :cea="ceaExtension"
            @update="(i: number, f: string, v: unknown) => updateCEA(`detailedTiming.${i}.${f}`, v)"
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
            @update="updateDisplayId"
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
        <HexViewer :data="edidData" />
      </section>
    </SidebarProvider>
  </div>
</template>
