<script setup lang="ts">
import { ref } from "vue";
import { useUiStore } from "../stores/uiStore";
import { useEdidStore } from "../stores/edidStore";
const uiStore = useUiStore();
const edidstore = useEdidStore();
import EDIDHeader from "./edid/EDIDHeader.vue";
import DisplayParameters from "./edid/DisplayParameters.vue";
import Chromaticity from "./edid/Chromaticity.vue";
import EstablishedTimings from "./edid/EstablishedTimings.vue";
import StandardTimings from "./edid/StandardTimings.vue";
import DisplayDescriptors from "./edid/DisplayDescriptors.vue";
import HexViewer from "./HexViewer.vue";
import { Button } from "@/components/ui/button";
const displayElement = ref("EDIDHeader");
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
</script>

<template>
  <ResizablePanelGroup direction="horizontal">
    <ResizablePanel id="handle-demo-panel-1" :default-size="25">
      <Button
        @click="displayElement = 'EDIDHeader'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'EDIDHeader'"
      >
        Header
      </Button>
      <Button
        @click="displayElement = 'DisplayParameters'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'DisplayParameters'"
      >
        DisplayParameters
      </Button>
      <Button
        @click="displayElement = 'Chromaticity'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'Chromaticity'"
      >
        Chromaticity
      </Button>
      <Button
        @click="displayElement = 'EstablishedTimings'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'EstablishedTimings'"
      >
        EstablishedTimings
      </Button>
      <Button
        @click="displayElement = 'StandardTimings'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'StandardTimings'"
      >
        StandardTimings
      </Button>
      <Button
        @click="displayElement = 'DisplayDescriptors'"
        class="w-full justify-start"
        variant="ghost"
        :pressed="displayElement === 'DisplayDescriptors'"
      >
        DisplayDescriptors
      </Button>
      <HexViewer :data="edidstore.mEEDID.EDID.raw" v-if="uiStore.showHexView" />
    </ResizablePanel>
    <ResizableHandle id="handle-demo-handle-1" with-handle />
    <ResizablePanel id="handle-demo-panel-2" :default-size="75">
      <EDIDHeader v-if="displayElement === 'EDIDHeader'" />
      <DisplayParameters v-if="displayElement === 'DisplayParameters'" />
      <Chromaticity v-if="displayElement === 'Chromaticity'" />
      <EstablishedTimings v-if="displayElement === 'EstablishedTimings'" />
      <StandardTimings v-if="displayElement === 'StandardTimings'" />
      <DisplayDescriptors v-if="displayElement === 'DisplayDescriptors'" />
    </ResizablePanel>
  </ResizablePanelGroup>
</template>
