<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  data: Uint8Array;
}>();

function toHex(byte: number): string {
  return byte.toString(16).padStart(2, "0").toUpperCase();
}

function toAscii(byte: number): string {
  if (byte >= 0x20 && byte <= 0x7e) {
    return String.fromCharCode(byte);
  }
  return "·";
}

const rowCount = computed(() => Math.ceil(props.data.length / 8));

function rowOffset(index: number): string {
  return "0x" + (index * 8).toString(16).padStart(4, "0").toUpperCase();
}
</script>

<template>
  <div class="font-mono text-xs select-none">
    <!-- Header row -->
    <div class="flex gap-1 text-muted-foreground mb-1">
      <div class="w-14 shrink-0">Offset</div>
      <div class="flex gap-1 flex-1">
        <div
          v-for="n in 8"
          :key="n"
          class="w-6 text-center"
        >
          {{ (n - 1).toString(16).padStart(2, "0").toUpperCase() }}
        </div>
      </div>
      <div class="w-16 text-right pl-2">ASCII</div>
    </div>

    <!-- Data rows -->
    <div
      v-for="row in rowCount"
      :key="row"
      class="flex gap-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-sm -mx-1 px-1 py-0.5 transition-colors"
    >
      <div class="w-14 shrink-0 text-muted-foreground">
        {{ rowOffset(row - 1) }}
      </div>
      <div class="flex gap-1 flex-1">
        <div
          v-for="col in 8"
          :key="col"
          class="w-6 text-center"
        >
          {{ (row - 1) * 8 + col - 1 < props.data.length ? toHex(props.data[(row - 1) * 8 + col - 1]) : "" }}
        </div>
      </div>
      <div class="w-16 text-right pl-2">
        <span
          v-for="col in 8"
          :key="col"
        >
          {{ (row - 1) * 8 + col - 1 < props.data.length ? toAscii(props.data[(row - 1) * 8 + col - 1]) : "" }}
        </span>
      </div>
    </div>
  </div>
</template>
