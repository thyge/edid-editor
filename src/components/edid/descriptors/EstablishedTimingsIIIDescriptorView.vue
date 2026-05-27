<script setup lang="ts">
import type { EstablishedTimingsIIIDescriptor } from 'edidts'

defineProps<{ descriptor: EstablishedTimingsIIIDescriptor }>()
</script>

<template>
  <div v-if="descriptor.timings.length > 0" class="space-y-1">
    <div v-for="(bit, index) in descriptor.timings" :key="index">
      Timing Bit {{ bit }}
    </div>
  </div>
  <div v-else class="text-muted-foreground">No bits set</div>
</template>
