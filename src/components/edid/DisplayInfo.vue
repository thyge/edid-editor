<script setup lang="ts">
import { computed } from 'vue'
import {
  VideoInputDefinition,
  DIGITAL_BIT_DEPTHS,
  DIGITAL_INTERFACES,
  ANALOG_SIGNAL_LEVELS,
  ANALOG_DISPLAY_TYPES,
  DIGITAL_COLOR_ENCODINGS,
} from 'edidts'
import type {
  DigitalBitDepth,
  DigitalInterface,
  DigitalVideoInput,
  AnalogVideoInput,
  AnalogSignalLevel,
  AnalogDisplayType,
  DigitalColorEncoding,
  ScreenSize,
} from 'edidts'
import type { EDIDViewModel } from '@/types/edid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

const props = defineProps<{
  edid: EDIDViewModel
}>()

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

const header = computed(() => props.edid.header)
const videoInput = computed(() => props.edid.videoInput)
const screenSize = computed(() => props.edid.screenSize)
const featureSupport = computed(() => props.edid.featureSupport)
const manufacturerName = computed(() => header.value.manufacturerName)

const isV14 = computed(() => header.value.edidVersion === 1 && header.value.edidRevision >= 4)
const isDigital = computed(() => videoInput.value.isDigital)
const digitalInput = computed(() => videoInput.value.input as DigitalVideoInput)
const analogInput = computed(() => videoInput.value.input as AnalogVideoInput)

const selectClass = 'flex h-8 w-full rounded-md border border-input dark:bg-input/30 bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
const switchRowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2 hover:bg-muted/50 transition-colors'

const colorEncodingLabels: Record<DigitalColorEncoding, string> = {
  'rgb444': 'RGB 4:4:4',
  'rgb444_ycrcb444': 'RGB 4:4:4 + YCrCb 4:4:4',
  'rgb444_ycrcb422': 'RGB 4:4:4 + YCrCb 4:2:2',
  'rgb444_ycrcb444_ycrcb422': 'RGB 4:4:4 + YCrCb 4:4:4 & 4:2:2',
}

const analogDisplayTypeLabels: Record<AnalogDisplayType, string> = {
  'monochrome': 'Monochrome / Grayscale',
  'rgb': 'RGB Color',
  'non-rgb': 'Non-RGB Color',
  'undefined': 'Undefined',
}

function bitDepthLabel(bd: DigitalBitDepth): string {
  return bd === 'undefined' ? 'Undefined' : `${bd}-bit`
}

function interfaceLabel(iface: DigitalInterface): string {
  return iface === 'undefined' ? 'Undefined' : iface
}

function switchInputType(type: string) {
  if (type === 'digital') {
    emit('update', 'videoInput', new VideoInputDefinition({ type: 'digital', bitDepth: 8, videoInterface: 'undefined' }))
  } else {
    emit('update', 'videoInput', new VideoInputDefinition({
      type: 'analog', signalLevel: '0.7/0.3V',
      videoSetup: false, separateSyncSupported: false,
      compositeSyncSupported: false, syncOnGreenSupported: false,
      vsyncSerrationSupported: false,
    }))
  }
}

function updateBitDepth(value: string) {
  const bd = (value === 'undefined' ? 'undefined' : Number(value)) as DigitalBitDepth
  emit('update', 'videoInput', new VideoInputDefinition({ ...digitalInput.value, bitDepth: bd }))
}

function updateInterface(value: string) {
  emit('update', 'videoInput', new VideoInputDefinition({ ...digitalInput.value, videoInterface: value as DigitalInterface }))
}

function updateSignalLevel(value: string) {
  emit('update', 'videoInput', new VideoInputDefinition({ ...analogInput.value, signalLevel: value as AnalogSignalLevel }))
}

function updateAnalogFlag(key: keyof AnalogVideoInput, value: boolean) {
  emit('update', 'videoInput', new VideoInputDefinition({ ...analogInput.value, [key]: value }))
}

function updateManufacturerId(value: string | number) {
  const id = String(value).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
  if (id.length === 3) emit('update', 'header.manufacturerId', id)
}

function updateProductCode(value: string | number) {
  const num = parseInt(String(value), 16)
  if (!isNaN(num) && num >= 0 && num <= 0xFFFF) emit('update', 'header.productCode', num)
}

function updateSerialNumber(value: string | number) {
  const num = parseInt(String(value), 10)
  if (!isNaN(num) && num >= 0) emit('update', 'header.serialNumber', num)
}

function updateWeek(value: string | number) {
  const num = parseInt(String(value), 10)
  if (!isNaN(num) && num >= 0 && num <= 54) emit('update', 'header.weekOfManufacture', num)
}

function updateYear(value: string | number) {
  const num = parseInt(String(value), 10)
  if (!isNaN(num) && num >= 1990 && num <= 2245) emit('update', 'header.yearOfManufacture', num)
}

function updateScreenSizeMode(mode: string) {
  if (mode === 'absolute') {
    emit('update', 'screenSize', { type: 'absolute', horizontalCm: 16, verticalCm: 9 } as ScreenSize)
  } else if (mode === 'landscape') {
    emit('update', 'screenSize', { type: 'aspect-ratio', landscapeAspectRatio: 79 } as ScreenSize)
  } else {
    emit('update', 'screenSize', { type: 'aspect-ratio', portraitAspectRatio: 79 } as ScreenSize)
  }
}

function screenSizeMode(): string {
  if (screenSize.value.type === 'absolute') return 'absolute'
  if (screenSize.value.landscapeAspectRatio !== undefined) return 'landscape'
  return 'portrait'
}

function updateScreenWidth(value: string | number) {
  const num = parseInt(String(value), 10)
  if (!isNaN(num) && num >= 0 && num <= 255) {
    emit('update', 'screenSize', { type: 'absolute', horizontalCm: num, verticalCm: screenSize.value.verticalCm ?? 0 })
  }
}

function updateScreenHeight(value: string | number) {
  const num = parseInt(String(value), 10)
  if (!isNaN(num) && num >= 0 && num <= 255) {
    emit('update', 'screenSize', { type: 'absolute', horizontalCm: screenSize.value.horizontalCm ?? 0, verticalCm: num })
  }
}

function updateAspectRatio(value: string | number) {
  const num = parseInt(String(value), 10)
  if (isNaN(num) || num < 1 || num > 255) return
  const mode = screenSizeMode()
  if (mode === 'landscape') {
    emit('update', 'screenSize', { type: 'aspect-ratio', landscapeAspectRatio: num } as ScreenSize)
  } else {
    emit('update', 'screenSize', { type: 'aspect-ratio', portraitAspectRatio: num } as ScreenSize)
  }
}

function updateGamma(value: string | number) {
  const num = parseFloat(String(value))
  if (!isNaN(num) && num >= 1.0 && num <= 3.54) emit('update', 'gamma', num)
}

function updateFeature(key: string, value: unknown) {
  emit('update', `featureSupport.${key}`, value)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Display Information</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <!-- Vendor & Product -->
      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Vendor & Product</h4>
        <div class="grid grid-cols-4 gap-x-6 gap-y-3">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Manufacturer ID</label>
            <Input
              :model-value="header.manufacturerId"
              class="h-8 font-mono uppercase"
              maxlength="3"
              @update:model-value="updateManufacturerId"
            />
            <p class="text-xs text-muted-foreground truncate">{{ manufacturerName ?? 'Unknown manufacturer' }}</p>
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Product Code</label>
            <Input
              :model-value="header.productCode.toString(16).toUpperCase().padStart(4, '0')"
              class="h-8 font-mono uppercase"
              maxlength="4"
              @update:model-value="updateProductCode"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Serial Number</label>
            <Input
              :model-value="header.serialNumber"
              type="number"
              class="h-8 font-mono"
              min="0"
              @update:model-value="updateSerialNumber"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">EDID Version</label>
            <select
              :value="`${header.edidVersion}.${header.edidRevision}`"
              :class="selectClass"
              @change="(e: Event) => {
                const [v, r] = (e.target as HTMLSelectElement).value.split('.').map(Number)
                emit('update', 'header.edidVersion', v)
                emit('update', 'header.edidRevision', r)
              }"
            >
              <option value="1.3">1.3</option>
              <option value="1.4">1.4</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Week</label>
            <Input
              :model-value="header.weekOfManufacture"
              type="number"
              class="h-8 font-mono"
              min="0"
              max="54"
              @update:model-value="updateWeek"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Year</label>
            <Input
              :model-value="header.yearOfManufacture"
              type="number"
              class="h-8 font-mono"
              min="1990"
              max="2245"
              @update:model-value="updateYear"
            />
          </div>
          <div />
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Checksum</label>
            <div class="flex h-8 items-center">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="edid.isValid
                  ? 'bg-green-500/10 text-green-500 ring-1 ring-inset ring-green-500/20'
                  : 'bg-red-500/10 text-red-500 ring-1 ring-inset ring-red-500/20'"
              >
                {{ edid.isValid ? 'Valid' : 'Invalid' }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Video Input Definition -->
      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Video Input Definition</h4>
        <div class="grid grid-cols-3 gap-x-6 gap-y-3">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Input Type</label>
            <select
              :value="isDigital ? 'digital' : 'analog'"
              :class="selectClass"
              @change="(e: Event) => switchInputType((e.target as HTMLSelectElement).value)"
            >
              <option value="digital">Digital</option>
              <option value="analog">Analog</option>
            </select>
          </div>

          <template v-if="isDigital">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Bit Depth</label>
              <select
                :value="String(digitalInput.bitDepth)"
                :class="[selectClass, !isV14 && 'opacity-50 cursor-not-allowed']"
                :disabled="!isV14"
                @change="(e: Event) => updateBitDepth((e.target as HTMLSelectElement).value)"
              >
                <option v-for="bd in DIGITAL_BIT_DEPTHS" :key="String(bd)" :value="String(bd)">{{ bitDepthLabel(bd) }}</option>
              </select>
              <p v-if="!isV14" class="text-xs text-muted-foreground">Not available in EDID 1.3</p>
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Interface</label>
              <select
                :value="digitalInput.videoInterface"
                :class="[selectClass, !isV14 && 'opacity-50 cursor-not-allowed']"
                :disabled="!isV14"
                @change="(e: Event) => updateInterface((e.target as HTMLSelectElement).value)"
              >
                <option v-for="iface in DIGITAL_INTERFACES" :key="iface" :value="iface">{{ interfaceLabel(iface) }}</option>
              </select>
              <p v-if="!isV14" class="text-xs text-muted-foreground">Not available in EDID 1.3</p>
            </div>
          </template>

          <template v-if="!isDigital">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Signal Level</label>
              <select
                :value="analogInput.signalLevel"
                :class="selectClass"
                @change="(e: Event) => updateSignalLevel((e.target as HTMLSelectElement).value)"
              >
                <option v-for="sl in ANALOG_SIGNAL_LEVELS" :key="sl" :value="sl">{{ sl }}</option>
              </select>
            </div>
          </template>
        </div>

        <!-- Color Encoding / Display Color Type (bits 4-3 of byte 18h) -->
        <div class="mt-3 max-w-sm">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">
              {{ isDigital && isV14 ? 'Color Encoding Format' : 'Display Color Type' }}
            </label>
            <select
              v-if="isDigital && isV14"
              :value="featureSupport.features.digitalColorEncoding ?? 'rgb444'"
              :class="selectClass"
              @change="(e: Event) => updateFeature('digitalColorEncoding', (e.target as HTMLSelectElement).value)"
            >
              <option v-for="enc in DIGITAL_COLOR_ENCODINGS" :key="enc" :value="enc">{{ colorEncodingLabels[enc] }}</option>
            </select>
            <select
              v-else
              :value="featureSupport.features.analogDisplayType ?? 'undefined'"
              :class="selectClass"
              @change="(e: Event) => updateFeature('analogDisplayType', (e.target as HTMLSelectElement).value)"
            >
              <option v-for="dt in ANALOG_DISPLAY_TYPES" :key="dt" :value="dt">{{ analogDisplayTypeLabels[dt] }}</option>
            </select>
          </div>
        </div>

        <div v-if="!isDigital" class="grid grid-cols-3 gap-x-6 gap-y-2 mt-3">
          <label :class="switchRowClass">
            <span>Video Setup</span>
            <Switch :checked="analogInput.videoSetup" @update:checked="(v: boolean) => updateAnalogFlag('videoSetup', v)" />
          </label>
          <label :class="switchRowClass">
            <span>Separate Sync</span>
            <Switch :checked="analogInput.separateSyncSupported" @update:checked="(v: boolean) => updateAnalogFlag('separateSyncSupported', v)" />
          </label>
          <label :class="switchRowClass">
            <span>Composite Sync</span>
            <Switch :checked="analogInput.compositeSyncSupported" @update:checked="(v: boolean) => updateAnalogFlag('compositeSyncSupported', v)" />
          </label>
          <label :class="switchRowClass">
            <span>Sync on Green</span>
            <Switch :checked="analogInput.syncOnGreenSupported" @update:checked="(v: boolean) => updateAnalogFlag('syncOnGreenSupported', v)" />
          </label>
          <label :class="switchRowClass">
            <span>VSync Serration</span>
            <Switch :checked="analogInput.vsyncSerrationSupported" @update:checked="(v: boolean) => updateAnalogFlag('vsyncSerrationSupported', v)" />
          </label>
        </div>
      </section>

      <!-- Screen Size / Aspect Ratio -->
      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Screen Size / Aspect Ratio</h4>
        <div class="grid grid-cols-3 gap-x-6 gap-y-3 max-w-lg">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Mode</label>
            <select
              :value="screenSizeMode()"
              :class="[selectClass, !isV14 && 'opacity-50 cursor-not-allowed']"
              :disabled="!isV14"
              @change="(e: Event) => updateScreenSizeMode((e.target as HTMLSelectElement).value)"
            >
              <option value="absolute">Absolute (cm)</option>
              <option value="landscape">Landscape Ratio</option>
              <option value="portrait">Portrait Ratio</option>
            </select>
            <p v-if="!isV14" class="text-xs text-muted-foreground">Aspect ratio not available in EDID 1.3</p>
          </div>

          <template v-if="screenSize.type === 'absolute'">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Width (cm)</label>
              <Input
                :model-value="screenSize.horizontalCm ?? 0"
                type="number"
                class="h-8 font-mono"
                min="0"
                max="255"
                @update:model-value="updateScreenWidth"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Height (cm)</label>
              <Input
                :model-value="screenSize.verticalCm ?? 0"
                type="number"
                class="h-8 font-mono"
                min="0"
                max="255"
                @update:model-value="updateScreenHeight"
              />
            </div>
          </template>

          <template v-else>
            <div class="col-span-2 space-y-1">
              <label class="text-xs text-muted-foreground">
                {{ screenSizeMode() === 'landscape' ? 'Landscape Aspect Ratio' : 'Portrait Aspect Ratio' }}
              </label>
              <div class="flex items-center gap-4">
                <Slider
                  :model-value="[screenSize.landscapeAspectRatio ?? screenSize.portraitAspectRatio ?? 1]"
                  :min="1"
                  :max="255"
                  :step="1"
                  class="flex-1"
                  @update:model-value="(v?: number[]) => { if (v?.length) updateAspectRatio(v[0]!) }"
                />
                <span class="text-sm font-mono w-20 text-right tabular-nums shrink-0">
                  {{ screenSizeMode() === 'landscape'
                    ? `${(((screenSize.landscapeAspectRatio ?? 0) + 99) / 100).toFixed(2)} : 1`
                    : `${(100 / ((screenSize.portraitAspectRatio ?? 0) + 99)).toFixed(2)} : 1`
                  }}
                </span>
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- Gamma -->
      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Gamma</h4>
        <div class="flex items-center gap-4 max-w-md">
          <Slider
            :model-value="[Math.round(edid.gamma * 100)]"
            :min="100"
            :max="354"
            :step="1"
            class="flex-1"
            @update:model-value="(v?: number[]) => { if (v?.length) updateGamma(v[0]! / 100) }"
          />
          <span class="text-sm font-mono w-12 text-right tabular-nums">{{ edid.gamma.toFixed(2) }}</span>
        </div>
        <p v-if="isV14" class="text-xs text-muted-foreground mt-1">
          In EDID 1.4, a stored value of FFh indicates gamma is defined in an extension block.
        </p>
      </section>

      <!-- Feature Support -->
      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Feature Support</h4>
        <div class="grid grid-cols-3 gap-x-6 gap-y-2">
          <label :class="switchRowClass">
            <span>Standby</span>
            <Switch
              :checked="featureSupport.features.standbySupported"
              @update:checked="(v: boolean) => updateFeature('standbySupported', v)"
            />
          </label>
          <label :class="switchRowClass">
            <span>Suspend</span>
            <Switch
              :checked="featureSupport.features.suspendSupported"
              @update:checked="(v: boolean) => updateFeature('suspendSupported', v)"
            />
          </label>
          <label :class="switchRowClass">
            <span>Active-Off</span>
            <Switch
              :checked="featureSupport.features.activeOffSupported"
              @update:checked="(v: boolean) => updateFeature('activeOffSupported', v)"
            />
          </label>
          <label :class="switchRowClass">
            <span>sRGB Default</span>
            <Switch
              :checked="featureSupport.features.sRGBDefault"
              @update:checked="(v: boolean) => updateFeature('sRGBDefault', v)"
            />
          </label>
          <label :class="switchRowClass">
            <span>{{ isV14 ? 'Native Format in PTM' : 'Preferred Timing' }}</span>
            <Switch
              :checked="featureSupport.features.preferredTimingMode"
              @update:checked="(v: boolean) => updateFeature('preferredTimingMode', v)"
            />
          </label>
          <label :class="switchRowClass">
            <span>{{ isV14 ? 'Continuous Frequency' : 'GTF Supported' }}</span>
            <Switch
              :checked="featureSupport.features.continuousFrequency"
              @update:checked="(v: boolean) => updateFeature('continuousFrequency', v)"
            />
          </label>
        </div>
      </section>
    </CardContent>
  </Card>
</template>
