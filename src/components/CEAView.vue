<script setup lang="ts">
import { ref } from "vue";
import { useEdidStore } from "@/stores/edidStore";
import { useUiStore } from "@/stores/uiStore";
const edidstore = useEdidStore();
const uiStore = useUiStore();
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { CardContent } from "@/components/ui/card";
import { CirclePlus } from "lucide-vue-next";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import HexViewer from "./HexViewer.vue";
const selectedBlock = ref(3);
const displayElement = ref("header");
import CEAHeader from "./cea/CEAHeader.vue";
import CEADataBlock from "./cea/CEADataBock.vue";
import DetailedTimingDescriptor from "./DetailedTimingDesciptor.vue";
function handleRemoveBlock(element: number) {
  blocks.splice(element, 1);
  console.log(element);
}
function handleAddBlock() {
  console.log("add block diag");
  console.log(displayElement);
}
</script>

<template>
  <ResizablePanelGroup direction="horizontal">
    <ResizablePanel id="handle-demo-panel-1" :default-size="25">
      <Toggle
        @click="
          displayElement = 'header';
          selectedBlock = 0;
        "
        variant="ghost"
        class="w-full justify-start"
        :pressed="displayElement === 'header'"
        >Header</Toggle
      >
      <template v-for="(block, index) in edidstore.mEEDID.CEA.DataBlocks">
        <Toggle
          @click="
            displayElement = 'block' + index;
            selectedBlock = index;
          "
          variant="ghost"
          class="w-full justify-start"
          :pressed="displayElement === 'block' + index"
          >{{ block.Header.Name }}</Toggle
        >
      </template>
      <template
        v-for="(dtd, index) in edidstore.mEEDID.CEA.DetailedTimingBlocks"
      >
        <Toggle
          @click="
            displayElement = 'dtd' + index;
            selectedBlock = index;
          "
          variant="ghost"
          class="w-full justify-start"
          :pressed="displayElement === 'dtd' + index"
        >
          {{ dtd.HorizontalActive }}x{{ dtd.VerticalActive }}@{{
            Math.round(dtd.VerticalRefreshRate)
          }}p
        </Toggle>
      </template>
      <Button
        @click="handleAddBlock()"
        variant="ghost"
        size="icon"
        class="w-full"
        ><CirclePlus
      /></Button>
      <HexViewer :data="edidstore.mEEDID.CEA.raw" v-if="uiStore.showHexView" />
    </ResizablePanel>
    <ResizableHandle id="handle-demo-handle-1" with-handle />
    <ResizablePanel id="handle-demo-panel-2" :default-size="75">
      <CEAHeader v-if="displayElement === 'header'" />
      <DetailedTimingDescriptor
        v-else-if="displayElement.includes('dtd')"
        :block="edidstore.mEEDID.CEA.DetailedTimingBlocks[selectedBlock]"
      />
      <CEADataBlock v-else :blockNum="selectedBlock" />
    </ResizablePanel>
  </ResizablePanelGroup>
</template>
