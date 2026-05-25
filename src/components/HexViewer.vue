<script setup lang="ts">
import { computed } from "vue";
import { formatByte } from "../edidts/utils";

interface Section {
  name: string;
  start: number;
}

const props = defineProps<{
  data: Uint8Array;
  sections?: Section[];
}>();

function isSectionStart(rowIndex: number): string | undefined {
  if (!props.sections) return undefined;
  const offset = rowIndex * 8;
  const section = props.sections.find((s) => s.start === offset);
  return section?.name;
}

const rowCount = computed(() => Math.ceil(props.data.length / 8));

function rowOffset(index: number): string {
  return (index * 8).toString(16).padStart(2, "0").toUpperCase();
}
</script>

<template>
  <div class="font-mono text-xs select-none">
    <div
      v-for="row in rowCount"
      :key="row"
    >
      <div
        v-if="isSectionStart(row - 1)"
        class="border-t border-sidebar-border pt-1 mt-1 mb-0.5"
      >
        <span class="text-[10px] text-muted-foreground uppercase tracking-wider">{{ isSectionStart(row - 1) }}</span>
      </div>
      <div
        class="flex items-center gap-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-sm -mx-1 px-1 py-0.5 transition-colors"
      >
        <div class="w-8 shrink-0 text-muted-foreground text-right">
          {{ rowOffset(row - 1) }}
        </div>
        <div class="grid grid-cols-8 gap-0.5 flex-1">
          <div
            v-for="col in 8"
            :key="col"
            class="text-center"
          >
            {{ (row - 1) * 8 + col - 1 < props.data.length ? formatByte(props.data[(row - 1) * 8 + col - 1]) : "" }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
