<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
  ProductNameDescriptor,
  ProductSerialDescriptor,
  AlphanumericDataDescriptor,
  DisplayDescriptor,
} from 'edidts'
import { Input } from '@/components/ui/input'

const DEFAULT_MAX_LENGTH = 13

type EditableDescriptor = ProductNameDescriptor | ProductSerialDescriptor | AlphanumericDataDescriptor

type EditableField = 'productName' | 'serialNumber' | 'data'

type Props = {
  descriptor: EditableDescriptor
  field: EditableField
  placeholder?: string
  maxLength?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{ update: [descriptor: DisplayDescriptor] }>()

const localValue = ref<string>(getDescriptorValue())

function getDescriptorValue(): string {
  const record = props.descriptor as Partial<Record<EditableField, string>>
  return record[props.field] ?? ''
}

watch(
  () => props.descriptor,
  () => {
    const next = getDescriptorValue()
    if (next !== localValue.value) {
      localValue.value = next
    }
  },
  { deep: true }
)

const maxLength = computed(() => props.maxLength ?? DEFAULT_MAX_LENGTH)
const remaining = computed(() => Math.max(0, maxLength.value - localValue.value.length))

function sanitize(value: string): string {
  return value.slice(0, maxLength.value)
}

function updateValue(next: string | number) {
  const candidate = sanitize(String(next ?? ''))
  if (candidate === localValue.value && candidate === getDescriptorValue()) {
    return
  }
  localValue.value = candidate
  const updated: EditableDescriptor = {
    ...props.descriptor,
    [props.field]: candidate,
  } as EditableDescriptor
  emit('update', updated as DisplayDescriptor)
}
</script>

<template>
  <div class="space-y-1">
    <Input
      :model-value="localValue"
      :maxlength="maxLength"
      :placeholder="placeholder"
      class="font-mono text-sm"
      @update:model-value="updateValue"
    />
    <p class="text-[11px] text-muted-foreground">{{ remaining }} characters remaining</p>
  </div>
</template>
