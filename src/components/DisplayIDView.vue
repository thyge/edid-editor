<script setup lang="ts">
import { useUiStore } from "@/stores/uiStore";
const uiStore = useUiStore();
</script>

<template>
  <div class="flex flex-1 flex-col gap-4">
    <div v-if="uiStore.activeSubSection === 'header'">Not implemented yet</div>
    <div v-else>Not implemented yet</div>
  </div>
</template>
