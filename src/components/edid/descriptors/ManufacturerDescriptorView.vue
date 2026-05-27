<script setup lang="ts">
import type { ManufacturerDescriptor } from 'edidts'

const props = defineProps<{ descriptor: ManufacturerDescriptor }>()

function formatData(): string {
  return Array.from(props.descriptor.data)
    .map((byte) => byte.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ')
}
</script>

<template>
  <div class="font-mono break-words">{{ formatData() }}</div>
</template>
