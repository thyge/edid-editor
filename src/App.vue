<script setup lang="ts">
import { ref, triggerRef, computed, onMounted } from 'vue'
import {
  EEDID,
  DetailedTimingDescriptor,
  DisplayIdDataBlockTag,
  createDefaultDisplayIdBlock,
  getCEAExtension,
  getDisplayIdExtension,
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
import { displayIdSectionIds } from '@/components/displayid/displayIdLabels'
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
  syncEdid()
}

function removeTiming(index: number) {
  if (!edidRef.value) return
  const timings = edidRef.value.base.detailedTimings.filter((_, i) => i !== index)
  edidRef.value.base.detailedTimings = timings
  syncEdid()
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
  syncEdid()
}

function createDefaultDescriptor(tag: number): DisplayDescriptor {
  switch (tag) {
    case 0xFC: return { tag: 0xFC, productName: '' }
    case 0xFF: return { tag: 0xFF, serialNumber: '' }
    case 0xFE: return { tag: 0xFE, data: '' }
    case 0xFD: return {
      tag: 0xFD,
      minVerticalRate: 48, maxVerticalRate: 75,
      minHorizontalRate: 30, maxHorizontalRate: 83,
      maxPixelClock: 170,
      timingSupport: 'default-gtf' as const,
    }
    case 0xFB: return { tag: 0xFB, colorPoints: [] }
    case 0xFA: return { tag: 0xFA, timings: [] }
    case 0xF9: return {
      tag: 0xF9, version: 3,
      redA3: 0, redA2: 0, greenA3: 0, greenA2: 0, blueA3: 0, blueA2: 0,
    }
    case 0xF8: return { tag: 0xF8, timings: [] }
    case 0xF7: return { tag: 0xF7, timings: [] }
    default: return { tag: 0x10 }
  }
}

function addDescriptor(tag: number) {
  if (!edidRef.value) return
  const descriptor = createDefaultDescriptor(tag)
  const descriptors = [...edidRef.value.base.displayDescriptors, descriptor]
  edidRef.value.base.displayDescriptors = descriptors
  syncEdid()
}

function removeDescriptor(index: number) {
  if (!edidRef.value) return
  const meaningful = edidRef.value.base.displayDescriptors.filter(d => d.tag !== 0x10)
  meaningful.splice(index, 1)
  const dummies = edidRef.value.base.displayDescriptors.filter(d => d.tag === 0x10)
  edidRef.value.base.displayDescriptors = [...meaningful, ...dummies]
  syncEdid()
}

function updateDescriptor(index: number, descriptor: DisplayDescriptor) {
  if (!edidRef.value) return
  const descriptors = [...edidRef.value.base.displayDescriptors]
  if (index < 0 || index >= descriptors.length) return
  descriptors[index] = descriptor
  edidRef.value.base.displayDescriptors = descriptors
  syncEdid()
}

/** Set a (possibly dotted) path on a plain object, mutating in place. */
function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.')
  let cur: Record<string, unknown> = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const next = cur[parts[i]]
    if (next == null || typeof next !== 'object') return
    cur = next as Record<string, unknown>
  }
  cur[parts[parts.length - 1]] = value
}

/** Edit a structured vendor data block — tag-0x03 VSDBs (HDMI 1.4, HDMI
 *  Forum, Microsoft HMD, AMD) and tag-0x07 ext-0x01 VSVDBs (Dolby Vision).
 *  Both carrier families now re-encode from block.vendor.fields, so a single
 *  handler covers them: mutate the fields object and reassign dataBlocks to
 *  trigger reactivity. The separate VSDB/VSVDB split existed only because the
 *  two carriers stored their structured shape differently; that is no longer
 *  true (TASK-67), so the split is collapsed here. Trailing vendor-reserved
 *  bytes live in the decoded shape's `trailing` field and survive the
 *  byte-complete vendor encoder. */
function updateVendorBlock(block: VendorSpecificDataBlock | VendorSpecificVideoDataBlock, field: string, value: unknown) {
  if (!edidRef.value) return
  const cea = getCEAExtension(edidRef.value)
  if (!cea) return
  const vendor = block.vendor
  if (!vendor || vendor.kind === 'unknown') return
  setByPath(vendor.fields as unknown as Record<string, unknown>, field, value)
  // Replace the fields object reference so the child component re-renders and
  // the CEA encoder reads the updated values.
  vendor.fields = { ...(vendor.fields as object) } as typeof vendor.fields
  cea.dataBlocks = [...cea.dataBlocks]
  syncEdid()
}

/** Edit a structured CTA-861 extended data block (tag 0x07: colorimetry 0x05,
 *  HDR static 0x06, HDR dynamic 0x07, YCbCr 4:2:0 0x0E, ...). These re-encode
 *  from their structured fields via encodeExtendedDataBlock, so mutating the
 *  block's fields and reassigning dataBlocks is enough. */
function updateExtendedBlock(block: object | undefined, field: string, value: unknown) {
  if (!edidRef.value || !block) return
  const cea = getCEAExtension(edidRef.value)
  if (!cea) return
  setByPath(block as unknown as Record<string, unknown>, field, value)
  cea.dataBlocks = [...cea.dataBlocks]
  syncEdid()
}

function syncEdid() {
  if (!edidRef.value) return
  const encoded = EEDID.encode(edidRef.value)
  edidStore.edidData.value = encoded
  triggerRef(edidStore.edid)
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

  syncEdid()
}

function updateTimings(field: string, value: unknown) {
  if (!edidRef.value) return
  if (field === 'establishedTimings') {
    edidRef.value.base.establishedTimings = value as EstablishedTiming[]
  } else if (field === 'standardTimings') {
    edidRef.value.base.standardTimings = value as StandardTiming[]
  }
  syncEdid()
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
  syncEdid()
}

function removeCEAExtension() {
  if (!edidRef.value) return
  edidRef.value.extensions = edidRef.value.extensions.filter(b => b.tag !== 0x02)
  if (activeSection.value.startsWith('cea-')) {
    activeSection.value = 'overview'
  }
  syncEdid()
}

function addCEADataBlock(blockType: string) {
  if (!edidRef.value) return
  const cea = getCEAExtension(edidRef.value)
  if (!cea) return
  const empty = new Uint8Array(0)

  switch (blockType) {
    case 'video':
      cea.dataBlocks.push({ tag: 0x02, payload: empty, vics: [] } as unknown as import('edidts').CEADataBlock)
      activeSection.value = 'cea-video'
      break
    case 'audio':
      cea.dataBlocks.push({ tag: 0x01, payload: empty, descriptors: [] } as unknown as import('edidts').CEADataBlock)
      activeSection.value = 'cea-audio'
      break
    case 'speakers':
      cea.dataBlocks.push({
        tag: 0x04, payload: empty,
        speakers: {
          frontLeftRight: true, lfe: false, frontCenter: false,
          rearLeftRight: false, rearCenter: false, frontLeftRightCenter: false,
          rearLeftRightCenter: false, frontLeftRightWide: false,
          frontLeftRightHigh: false, topCenter: false, frontCenterHigh: false,
          surroundLeftRight: false, lfe2: false, topBackCenter: false,
          sideLeftRight: false, topSideLeftRight: false,
          topBackLeftRight: false, bottomFrontCenter: false,
          bottomFrontLeftRight: false, topLeftRightSurround: false,
        },
        trailing: new Uint8Array(),
      } as unknown as import('edidts').CEADataBlock)
      activeSection.value = 'cea-speakers'
      break
    case 'video-capability':
      cea.dataBlocks.push({
        tag: 0x07, extendedTag: 0x00, payload: empty,
        ceVideoScanBehavior: 'not_supported',
        itVideoScanBehavior: 'not_supported',
        ptVideoScanBehavior: 'not_supported',
        quantizationRangeSelectable: false,
        quantizationRangeYCC: false,
      } as unknown as import('edidts').CEADataBlock)
      activeSection.value = 'cea-video-cap'
      break
    case 'colorimetry':
      cea.dataBlocks.push({
        tag: 0x07, extendedTag: 0x05, payload: empty,
        xvYCC601: false, xvYCC709: false, sYCC601: false, opYCC601: false,
        opRGB: false, bt2020cYCC: false, bt2020YCC: false, bt2020RGB: false, dciP3: false,
      } as unknown as import('edidts').CEADataBlock)
      activeSection.value = 'cea-hdr-color'
      break
    case 'hdr-static':
      cea.dataBlocks.push({
        tag: 0x07, extendedTag: 0x06, payload: empty,
        eotf: { traditionalGammaSDR: false, traditionalGammaHDR: false, smpte2084: false, hlg: false },
        staticMetadataType1: false,
      } as unknown as import('edidts').CEADataBlock)
      activeSection.value = 'cea-hdr-color'
      break
    case 'video-format-preference':
      cea.dataBlocks.push({
        tag: 0x07, extendedTag: 0x0D, payload: empty, svrs: [],
      } as unknown as import('edidts').CEADataBlock)
      activeSection.value = 'cea-video-format-pref'
      break
    case 'vendor-audio':
      cea.dataBlocks.push({
        tag: 0x07, extendedTag: 0x11, payload: empty, ieeeOui: 0, vendorPayload: new Uint8Array(),
      } as unknown as import('edidts').CEADataBlock)
      activeSection.value = 'cea-vendor-audio'
      break
    case 'room-config':
      cea.dataBlocks.push({
        tag: 0x07, extendedTag: 0x13, payload: empty, speakerCount: 0, speakerPresenceDescriptor: 0,
      } as unknown as import('edidts').CEADataBlock)
      activeSection.value = 'cea-room-config'
      break
    case 'speaker-location':
      cea.dataBlocks.push({
        tag: 0x07, extendedTag: 0x14, payload: empty, descriptors: [], trailing: new Uint8Array(),
      } as unknown as import('edidts').CEADataBlock)
      activeSection.value = 'cea-speaker-location'
      break
    case 'infoframe':
      cea.dataBlocks.push({
        tag: 0x07, extendedTag: 0x20, payload: empty,
        additionalVsifs: 0, processingPayload: new Uint8Array(), descriptors: [], trailing: new Uint8Array(),
      } as unknown as import('edidts').CEADataBlock)
      activeSection.value = 'cea-infoframe'
      break
    case 'vesa-transfer':
      cea.dataBlocks.push({
        tag: 0x05, payload: new Uint8Array(1), transferType: 'white', numEntries: 8, gammaValues: new Array(8).fill(0),
      } as unknown as import('edidts').CEADataBlock)
      activeSection.value = 'cea-vesa-transfer'
      break
  }
  syncEdid()
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
  syncEdid()
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
  syncEdid()
}

function removeDisplayIdExtension() {
  if (!edidRef.value) return
  edidRef.value.extensions = edidRef.value.extensions.filter(b => b.tag !== 0x70)
  if (activeSection.value.startsWith('displayid-')) {
    activeSection.value = 'overview'
  }
  syncEdid()
}

function addDisplayIdBlock(tag: number) {
  const displayId = displayIdExtension.value
  if (!displayId) return
  displayId.section.blocks.push(createDefaultDisplayIdBlock(tag as DisplayIdDataBlockTag))
  activeSection.value = displayIdSectionIds.overview
  syncEdid()
}

function removeDisplayIdBlock(index: number) {
  const displayId = displayIdExtension.value
  if (!displayId) return
  displayId.section.blocks.splice(index, 1)
  syncEdid()
}

function moveDisplayIdBlock(index: number, direction: -1 | 1) {
  const displayId = displayIdExtension.value
  if (!displayId) return
  const blocks = displayId.section.blocks
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= blocks.length) return
  const [block] = blocks.splice(index, 1)
  blocks.splice(nextIndex, 0, block)
  syncEdid()
}

function updateDisplayId(field: string, value: unknown) {
  const displayId = displayIdExtension.value
  if (!displayId) return
  const section = displayId.section
  if (field === 'primaryUseCase') section.primaryUseCase = value as number
  if (field === 'extensionCount') section.extensionCount = value as number
  syncEdid()
}

function updateDisplayIdBlock(index: number, block: DisplayIdDataBlock) {
  const displayId = displayIdExtension.value
  if (!displayId) return
  displayId.section.blocks[index] = block
  syncEdid()
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

  syncEdid()
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
            v-else-if="activeSection === 'descriptor-blocks'"
            :edid="edidRef!"
            @add-timing="addTiming"
            @remove-timing="removeTiming"
            @add-descriptor="addDescriptor"
            @remove-descriptor="removeDescriptor"
            @update-descriptor="updateDescriptor"
            @update-timing="updateDetailedTiming"
          />

          <!-- CEA sections -->
          <CEAOverview v-else-if="activeSection === 'cea-overview' && ceaExtension" :cea="ceaExtension" @update="updateCEA" />
          <CEAHeaderFlags v-else-if="activeSection === 'cea-header' && ceaExtension" :cea="ceaExtension" @update="updateCEA" />
          <CEAVideoBlock v-else-if="activeSection === 'cea-video' && ceaExtension" :cea="ceaExtension" @update="updateCEA" />
          <CEAAudioBlock v-else-if="activeSection === 'cea-audio' && ceaExtension" :cea="ceaExtension" @update="updateCEA" />
          <CEASpeakerBlock v-else-if="activeSection === 'cea-speakers' && ceaExtension" :cea="ceaExtension" @update="updateCEA" />
          <CEAVendorBlock v-else-if="activeSection === 'cea-vendor' && ceaExtension" :cea="ceaExtension" @update="updateVendorBlock" @update-vsvdb="updateVendorBlock" />
          <CEAHDRColorimetry v-else-if="activeSection === 'cea-hdr-color' && ceaExtension" :cea="ceaExtension" @update="updateExtendedBlock" />
          <CEAVideoCapability v-else-if="activeSection === 'cea-video-cap' && ceaExtension" :cea="ceaExtension" @update="updateCEA" />
          <CEAVideoFormatPreference v-else-if="activeSection === 'cea-video-format-pref' && ceaExtension" :cea="ceaExtension" @update="updateExtendedBlock" />
          <CEAVendorAudioBlock v-else-if="activeSection === 'cea-vendor-audio' && ceaExtension" :cea="ceaExtension" @update="updateExtendedBlock" />
          <CEARoomConfiguration v-else-if="activeSection === 'cea-room-config' && ceaExtension" :cea="ceaExtension" @update="updateExtendedBlock" />
          <CEASpeakerLocation v-else-if="activeSection === 'cea-speaker-location' && ceaExtension" :cea="ceaExtension" @update="updateExtendedBlock" />
          <CEAInfoFrame v-else-if="activeSection === 'cea-infoframe' && ceaExtension" :cea="ceaExtension" @update="updateExtendedBlock" />
          <CEAVesaTransferCharacteristic v-else-if="activeSection === 'cea-vesa-transfer' && ceaExtension" :cea="ceaExtension" @update="updateExtendedBlock" />
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
