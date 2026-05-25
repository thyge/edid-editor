<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
import { useUiStore } from "@/stores/uiStore";
import HexViewer from "@/components/HexViewer.vue";

const edidStore = useEdidStore();
const uiStore = useUiStore();
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
      <HexViewer :data="edidStore.mEEDID.raw" />
    </div>
  </div>
</template>
