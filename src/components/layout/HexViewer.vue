<script setup lang="ts">
import { computed } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'

const props = defineProps<{
  data?: Uint8Array | null
}>()

const displayData = computed(() => props.data ?? new Uint8Array(128))

function formatHex(byte: number): string {
  return byte.toString(16).padStart(2, '0').toUpperCase()
}

function getRows(data: Uint8Array): number[][] {
  const rows: number[][] = []
  for (let i = 0; i < data.length; i += 8) {
    rows.push(Array.from(data.slice(i, i + 8)))
  }
  return rows
}
</script>

<template>
  <aside class="w-64 border-l border-border bg-background flex flex-col">
    <div class="p-3 border-b border-border flex justify-between items-center">
      <h2 class="text-sm font-medium">Hex View</h2>
      <span class="text-xs text-muted-foreground">{{ displayData.length }} bytes</span>
    </div>
    <ScrollArea class="flex-1">
      <div class="p-3 font-mono text-xs">
        <div
          v-for="(row, rowIndex) in getRows(displayData)"
          :key="rowIndex"
          class="flex gap-1 py-0.5"
        >
          <span class="text-muted-foreground w-8">{{ (rowIndex * 8).toString(16).padStart(3, '0').toUpperCase() }}</span>
          <span
            v-for="(byte, byteIndex) in row"
            :key="byteIndex"
            class="w-6 text-center hover:bg-accent rounded cursor-default"
            :title="`Offset 0x${((rowIndex * 8) + byteIndex).toString(16).toUpperCase()}`"
          >
            {{ formatHex(byte) }}
          </span>
        </div>
      </div>
    </ScrollArea>
  </aside>
</template>
