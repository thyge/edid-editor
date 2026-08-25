<script setup lang="ts">
import { computed } from 'vue'
import type { DisplayDescriptor } from 'edidts'
import { getDescriptorLabel } from './descriptors/descriptorLabels'
import StringDescriptorEditor from './descriptors/StringDescriptorEditor.vue'
import RangeLimitsDescriptorView from './descriptors/RangeLimitsDescriptorView.vue'
import ColorPointDescriptorView from './descriptors/ColorPointDescriptorView.vue'
import StandardTimingDescriptorView from './descriptors/StandardTimingDescriptorView.vue'
import DCMDescriptorView from './descriptors/DCMDescriptorView.vue'
import CVTTimingDescriptorView from './descriptors/CVTTimingDescriptorView.vue'
import EstablishedTimingsIIIDescriptorView from './descriptors/EstablishedTimingsIIIDescriptorView.vue'
import ManufacturerDescriptorView from './descriptors/ManufacturerDescriptorView.vue'

const props = defineProps<{
  descriptors: DisplayDescriptor[]
  focus?: string
}>()

const emit = defineEmits<{
  updateDescriptor: [index: number, descriptor: DisplayDescriptor]
}>()

// When focused on a single descriptor (edid-desc-<sourceIndex>), render only
// that entry. sourceIndex stays the real index into the full descriptors
// array, so update emits remain correct.
const focusedSourceIndex = computed(() => {
  const f = props.focus ?? ''
  if (!f.startsWith('edid-desc-')) return -1
  const idx = Number(f.slice('edid-desc-'.length))
  return Number.isNaN(idx) ? -1 : idx
})

const primaryOrder: number[] = [0xFC, 0xFB, 0xFA, 0xF9, 0xF8, 0xF7]

function getDescriptorSortValue(tag: number): number {
  const primaryIndex = primaryOrder.indexOf(tag)
  if (primaryIndex !== -1) {
    return primaryIndex
  }
  if (tag >= 0x00 && tag <= 0x0F) {
    return primaryOrder.length
  }
  if (tag >= 0x11 && tag <= 0xF6) {
    return primaryOrder.length + 1
  }
  return primaryOrder.length + 2
}

type OrderedDescriptor = {
  descriptor: DisplayDescriptor
  sourceIndex: number
}

const orderedDescriptors = computed<OrderedDescriptor[]>(() => {
  const all = props.descriptors
    .map((descriptor, index) => ({ descriptor, sourceIndex: index }))
    .filter((entry) => entry.descriptor.tag !== 0x10)
    .sort((a, b) => {
      const orderDiff = getDescriptorSortValue(a.descriptor.tag) - getDescriptorSortValue(b.descriptor.tag)
      if (orderDiff !== 0) {
        return orderDiff
      }
      return a.descriptor.tag - b.descriptor.tag
    })
  if (focusedSourceIndex.value === -1) return all
  return all.filter((entry) => entry.sourceIndex === focusedSourceIndex.value)
})

function handleDescriptorUpdate(index: number, descriptor: DisplayDescriptor) {
  emit('updateDescriptor', index, descriptor)
}
</script>

<template>
  <div :class="['space-y-3', focusedSourceIndex === -1 ? 'border-t pt-4' : '']">
    <h4 v-if="focusedSourceIndex === -1" class="font-medium text-muted-foreground">Display Descriptors</h4>
    <div class="space-y-3">
      <div
        v-for="entry in orderedDescriptors"
        :id="`edid-card-desc-${entry.sourceIndex}`"
        :key="entry.sourceIndex"
        class="rounded-lg border bg-card p-3 text-sm scroll-mt-6"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ getDescriptorLabel(entry.descriptor.tag) }}</span>
            <span class="text-xs text-muted-foreground">Tag 0x{{ entry.descriptor.tag.toString(16).toUpperCase().padStart(2, '0') }}</span>
          </div>
        </div>

        <div class="mt-2 text-xs space-y-2">
          <StringDescriptorEditor
            v-if="entry.descriptor.tag === 0xFC"
            :descriptor="(entry.descriptor as any)"
            field="productName"
            placeholder="Enter product name"
            @update="(updated) => handleDescriptorUpdate(entry.sourceIndex, updated)"
          />
          <StringDescriptorEditor
            v-else-if="entry.descriptor.tag === 0xFF"
            :descriptor="(entry.descriptor as any)"
            field="serialNumber"
            placeholder="Enter serial number"
            @update="(updated) => handleDescriptorUpdate(entry.sourceIndex, updated)"
          />
          <StringDescriptorEditor
            v-else-if="entry.descriptor.tag === 0xFE"
            :descriptor="(entry.descriptor as any)"
            field="data"
            placeholder="Enter data string"
            @update="(updated) => handleDescriptorUpdate(entry.sourceIndex, updated)"
          />
          <RangeLimitsDescriptorView
            v-else-if="entry.descriptor.tag === 0xFD"
            :descriptor="(entry.descriptor as any)"
            @update="(updated) => handleDescriptorUpdate(entry.sourceIndex, updated)"
          />
          <ColorPointDescriptorView
            v-else-if="entry.descriptor.tag === 0xFB"
            :descriptor="(entry.descriptor as any)"
            @update="(updated) => handleDescriptorUpdate(entry.sourceIndex, updated)"
          />
          <StandardTimingDescriptorView
            v-else-if="entry.descriptor.tag === 0xFA"
            :descriptor="(entry.descriptor as any)"
            @update="(updated) => handleDescriptorUpdate(entry.sourceIndex, updated)"
          />
          <DCMDescriptorView
            v-else-if="entry.descriptor.tag === 0xF9"
            :descriptor="(entry.descriptor as any)"
            @update="(updated) => handleDescriptorUpdate(entry.sourceIndex, updated)"
          />
          <CVTTimingDescriptorView
            v-else-if="entry.descriptor.tag === 0xF8"
            :descriptor="(entry.descriptor as any)"
            @update="(updated) => handleDescriptorUpdate(entry.sourceIndex, updated)"
          />
          <EstablishedTimingsIIIDescriptorView
            v-else-if="entry.descriptor.tag === 0xF7"
            :descriptor="(entry.descriptor as any)"
            @update="(updated) => handleDescriptorUpdate(entry.sourceIndex, updated)"
          />
          <ManufacturerDescriptorView v-else-if="entry.descriptor.tag >= 0x00 && entry.descriptor.tag <= 0x0F" :descriptor="(entry.descriptor as any)" />
          <span v-else class="text-muted-foreground">Descriptor type not yet supported</span>
        </div>
      </div>
    </div>
  </div>
</template>
