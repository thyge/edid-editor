<script setup lang="ts">
import type { DCMDescriptor } from 'edidts'

defineProps<{ descriptor: DCMDescriptor }>()
</script>

<template>
  <div class="grid grid-cols-1 gap-1 sm:grid-cols-2">
    <div>Version: {{ descriptor.version }}</div>
    <div>Red A3: {{ descriptor.redA3 }}</div>
    <div>Red A2: {{ descriptor.redA2 }}</div>
    <div>Green A3: {{ descriptor.greenA3 }}</div>
    <div>Green A2: {{ descriptor.greenA2 }}</div>
    <div>Blue A3: {{ descriptor.blueA3 }}</div>
    <div>Blue A2: {{ descriptor.blueA2 }}</div>
  </div>
</template>
