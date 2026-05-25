<script setup lang="ts">
import { computed } from "vue";
import { useEdidStore } from "@/stores/edidStore";
import { useUiStore } from "@/stores/uiStore";
import HexViewer from "@/components/HexViewer.vue";

const edidStore = useEdidStore();
const uiStore = useUiStore();

const sections = computed(() => {
  const result: Array<{ name: string; start: number }> = [];
  let offset = 0;
  result.push({ name: "EDID", start: offset });
  offset += 128;
  if (edidStore.mEEDID.hasCEA) {
    result.push({ name: "CEA-861", start: offset });
    offset += 128;
  }
  if (edidStore.mEEDID.hasDisplayID) {
    result.push({ name: "DisplayID", start: offset });
  }
  return result;
});
</script>

<template>
  <!-- Layout gap that pushes main content when panel is open -->
  <div
    class="hidden lg:block bg-transparent transition-all duration-200 ease-linear"
    :class="uiStore.showHexView ? 'w-[16rem]' : 'w-0'"
  />

  <!-- Fixed right panel -->
  <div
    class="fixed inset-y-0 right-0 z-10 hidden lg:flex h-svh w-[16rem] flex-col border-l bg-sidebar text-sidebar-foreground transition-all duration-200 ease-linear"
    :class="uiStore.showHexView ? 'translate-x-0' : 'translate-x-full'"
  >
    <div class="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
      <span class="text-sm font-medium">Hex View</span>
    </div>
    <div class="flex-1 overflow-auto p-2">
      <HexViewer :data="edidStore.mEEDID.raw" :sections="sections" />
    </div>
  </div>
</template>
