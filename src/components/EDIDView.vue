<script setup lang="ts">
import { ref } from "vue";
import { useUiStore } from "../stores/uiStore";
const uiStore = useUiStore();
import EDIDHeader from "./edid/EDIDHeader.vue";
import DisplayParameters from "./edid/DisplayParameters.vue";
import Chromaticity from "./edid/Chromaticity.vue";
import EstablishedTimings from "./edid/EstablishedTimings.vue";
import StandardTimings from "./edid/StandardTimings.vue";
import DisplayDescriptors from "./edid/DisplayDescriptors.vue";
import { Card } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import HexViewer from "./HexViewer.vue";
const displayElement = ref("DisplayParameters");
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
</script>

<template>
  <ResizablePanelGroup
      direction="horizontal"
      class="h-full"
    >
    <ResizablePanel id="handle-demo-panel-1" :default-size="25">
      <Toggle
        @click="displayElement = 'EDIDHeader'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'EDIDHeader'"
      >
        Header
      </Toggle>
      <Toggle
        @click="displayElement = 'DisplayParameters'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'DisplayParameters'"
      >
        DisplayParameters
      </Toggle>
      <Toggle
        @click="displayElement = 'Chromaticity'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'Chromaticity'"
      >
        Chromaticity
      </Toggle>
      <Toggle
        @click="displayElement = 'EstablishedTimings'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'EstablishedTimings'"
      >
        EstablishedTimings
      </Toggle>
      <Toggle
        @click="displayElement = 'StandardTimings'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'StandardTimings'"
      >
        StandardTimings
      </Toggle>
      <Toggle
        @click="displayElement = 'DisplayDescriptors'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'DisplayDescriptors'"
      >
        DisplayDescriptors
      </Toggle>
    </ResizablePanel>
    <ResizableHandle id="handle-demo-handle-1" with-handle />
    <ResizablePanel id="handle-demo-panel-2" :default-size="75">
      <EDIDHeader v-if="displayElement === 'EDIDHeader'" />
      <DisplayParameters v-if="displayElement === 'DisplayParameters'" />
      <Chromaticity v-if="displayElement === 'Chromaticity'" />
      <EstablishedTimings v-if="displayElement === 'EstablishedTimings'" />
      <StandardTimings v-if="displayElement === 'StandardTimings'" />
      <DisplayDescriptors v-if="displayElement === 'DisplayDescriptors'" />
      <div class="row-span-2">
      <HexViewer v-if="uiStore.showHexView" />
    </div>
    </ResizablePanel>
  </ResizablePanelGroup>
</template>
