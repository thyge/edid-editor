<script setup lang="ts">
import { computed } from 'vue'
import type { DisplayDescriptor } from 'edidts'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  canAdd: boolean
}>()

const emit = defineEmits<{
  addDescriptor: [tag: number]
  removeDescriptor: [index: number]
  updateDescriptor: [index: number, descriptor: DisplayDescriptor]
}>()

const descriptorOptions = [
  { tag: 0xFF, label: 'Serial Number' },
  { tag: 0xFE, label: 'Data String' },
  { tag: 0xFD, label: 'Range Limits' },
  { tag: 0xFC, label: 'Product Name' },
  { tag: 0xFB, label: 'Color Points' },
  { tag: 0xFA, label: 'Standard Timing IDs' },
  { tag: 0xF9, label: 'Display Color Management' },
  { tag: 0xF8, label: 'CVT 3 Byte Codes' },
  { tag: 0xF7, label: 'Established Timings III' },
]

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

const orderedDescriptors = computed<OrderedDescriptor[]>(() =>
  props.descriptors
    .map((descriptor, index) => ({ descriptor, sourceIndex: index }))
    .filter((entry) => entry.descriptor.tag !== 0x10)
    .sort((a, b) => {
      const orderDiff = getDescriptorSortValue(a.descriptor.tag) - getDescriptorSortValue(b.descriptor.tag)
      if (orderDiff !== 0) {
        return orderDiff
      }
      return a.descriptor.tag - b.descriptor.tag
    })
)

function handleDescriptorUpdate(index: number, descriptor: DisplayDescriptor) {
  emit('updateDescriptor', index, descriptor)
}

function getDescriptorLabel(tag: number): string {
  const labels: Record<number, string> = {
    0xFF: 'Serial Number',
    0xFE: 'Data String',
    0xFD: 'Range Limits',
    0xFC: 'Product Name',
    0xFB: 'Color Points',
    0xFA: 'Standard Timing IDs',
    0xF9: 'DCM Data',
    0xF8: 'CVT Timing',
    0xF7: 'Established Timings III',
  }

  if (tag >= 0x00 && tag <= 0x0F) {
    return 'Manufacturer Descriptor'
  }

  if (tag >= 0x11 && tag <= 0xF6) {
    return 'Reserved Descriptor'
  }

  return labels[tag] ?? `Descriptor 0x${tag.toString(16).toUpperCase()}`
}
</script>

<template>
  <div class="border-t pt-4 space-y-3">
    <div class="flex items-center justify-between">
      <h4 class="font-medium text-muted-foreground">Display Descriptors</h4>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" :disabled="!canAdd">Add Descriptor</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent v-if="canAdd" align="end">
          <DropdownMenuItem
            v-for="opt in descriptorOptions"
            :key="opt.tag"
            @click="emit('addDescriptor', opt.tag)"
          >
            {{ opt.label }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <div class="space-y-3">
      <div
        v-for="entry in orderedDescriptors"
        :key="entry.sourceIndex"
        class="rounded-lg border p-3 text-sm"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ getDescriptorLabel(entry.descriptor.tag) }}</span>
            <span class="text-xs text-muted-foreground">Tag 0x{{ entry.descriptor.tag.toString(16).toUpperCase().padStart(2, '0') }}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="text-destructive hover:text-destructive hover:bg-destructive/10"
            @click="emit('removeDescriptor', entry.sourceIndex)"
          >
            Remove
          </Button>
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
          <DCMDescriptorView v-else-if="entry.descriptor.tag === 0xF9" :descriptor="(entry.descriptor as any)" />
          <CVTTimingDescriptorView v-else-if="entry.descriptor.tag === 0xF8" :descriptor="(entry.descriptor as any)" />
          <EstablishedTimingsIIIDescriptorView v-else-if="entry.descriptor.tag === 0xF7" :descriptor="(entry.descriptor as any)" />
          <ManufacturerDescriptorView v-else-if="entry.descriptor.tag >= 0x00 && entry.descriptor.tag <= 0x0F" :descriptor="(entry.descriptor as any)" />
          <span v-else class="text-muted-foreground">Descriptor type not yet supported</span>
        </div>
      </div>
    </div>
  </div>
</template>
