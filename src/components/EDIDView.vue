<script setup lang="ts">
import { useUiStore } from "@/stores/uiStore";
const uiStore = useUiStore();
import EDIDHeader from "./edid/EDIDHeader.vue";
import DisplayParameters from "./edid/DisplayParameters.vue";
import Chromaticity from "./edid/Chromaticity.vue";
import EstablishedTimings from "./edid/EstablishedTimings.vue";
import StandardTimings from "./edid/StandardTimings.vue";
import DisplayDescriptors from "./edid/DisplayDescriptors.vue";
</script>

<template>
  <div class="flex flex-1 flex-col gap-4">
    <EDIDHeader v-if="uiStore.activeSubSection === 'header'" />
    <DisplayParameters v-if="uiStore.activeSubSection === 'displayParameters'" />
    <Chromaticity v-if="uiStore.activeSubSection === 'chromaticity'" />
    <EstablishedTimings v-if="uiStore.activeSubSection === 'establishedTimings'" />
    <StandardTimings v-if="uiStore.activeSubSection === 'standardTimings'" />
    <DisplayDescriptors v-if="uiStore.activeSubSection === 'displayDescriptors'" />
  </div>
</template>
