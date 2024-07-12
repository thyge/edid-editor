<script setup lang="ts">
import { ref } from "vue";
import EDIDHeader from "./edid/EDIDHeader.vue";
import DisplayParameters from "./edid/DisplayParameters.vue";
import Chromaticity from "./edid/Chromaticity.vue";
import EstablishedTimings from "./edid/EstablishedTimings.vue";
import StandardTimings from "./edid/StandardTimings.vue";
import DisplayDescriptors from "./edid/DisplayDescriptors.vue";
import { Card } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import HexViewer from "./HexViewer.vue";
const displayElement = ref("EDIDHeader");
</script>

<template>
  <div class="grid grid-cols-6 gap-1 h-screen">
    <Card class="col-span-1">
      <Toggle
        @click="displayElement = 'EDIDHeader'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'EDIDHeader'"
        >Header</Toggle
      >
      <Toggle
        @click="displayElement = 'DisplayParameters'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'DisplayParameters'"
        >DisplayParameters</Toggle
      >
      <Toggle
        @click="displayElement = 'Chromaticity'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'Chromaticity'"
        >Chromaticity</Toggle
      >
      <Toggle
        @click="displayElement = 'EstablishedTimings'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'EstablishedTimings'"
        >EstablishedTimings</Toggle
      >
      <Toggle
        @click="displayElement = 'StandardTimings'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'StandardTimings'"
        >StandardTimings</Toggle
      >
      <Toggle
        @click="displayElement = 'DisplayDescriptors'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'DisplayDescriptors'"
        >DisplayDescriptors</Toggle
      >
    </Card>
    <div class="col-span-4">
      <EDIDHeader v-if="displayElement === 'EDIDHeader'" />
      <DisplayParameters v-if="displayElement === 'DisplayParameters'" />
      <Chromaticity v-if="displayElement === 'Chromaticity'" />
      <EstablishedTimings v-if="displayElement === 'EstablishedTimings'" />
      <StandardTimings v-if="displayElement === 'StandardTimings'" />
      <DisplayDescriptors v-if="displayElement === 'DisplayDescriptors'" />
    </div>
    <div class="col-span-1">
      <HexViewer />
    </div>
  </div>
</template>
