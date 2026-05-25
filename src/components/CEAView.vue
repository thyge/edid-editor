<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
import { useUiStore } from "@/stores/uiStore";
const edidstore = useEdidStore();
const uiStore = useUiStore();
import { computed } from "vue";
import CEAHeader from "./cea/CEAHeader.vue";
import CEADataBlock from "./cea/CEADataBock.vue";
import DetailedTimingDescriptor from "./DetailedTimingDesciptor.vue";

const blockIndex = computed(() => {
  const parts = uiStore.activeSubSection.split("-");
  if (parts.length === 2) {
    const idx = parseInt(parts[1], 10);
    if (!isNaN(idx)) return idx;
  }
  return -1;
});
</script>

<template>
  <div class="flex flex-1 flex-col gap-4">
    <CEAHeader v-if="uiStore.activeSubSection === 'header'" />
    <DetailedTimingDescriptor
      v-else-if="uiStore.activeSubSection.startsWith('dtd-')"
      :block="edidstore.mEEDID.CEA.DetailedTimingBlocks[blockIndex]"
      :id="blockIndex"
    />
    <CEADataBlock v-else :blockNum="blockIndex" />
  </div>
</template>
