<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
import HexViewer from "@/components/HexViewer.vue";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";

const edidStore = useEdidStore();
</script>

<template>
  <Sidebar
    class="sticky hidden lg:flex top-0 h-svh border-l"
    collapsible="none"
  >
    <SidebarHeader class="h-16 border-b border-sidebar-border flex items-center px-4">
      <span class="text-sm font-medium">Hex View</span>
    </SidebarHeader>
    <SidebarContent class="p-2 overflow-auto">
      <HexViewer :data="edidStore.mEEDID.raw" />
    </SidebarContent>
  </Sidebar>
</template>
