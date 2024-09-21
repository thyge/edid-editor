<script setup lang="ts">
import { ref } from "vue";
import { useEdidStore } from "@/stores/edidStore";
import { useUiStore } from "@/stores/uiStore";
const edidstore = useEdidStore();
const uiStore = useUiStore();
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { CirclePlus } from "lucide-vue-next";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import HexViewer from "./HexViewer.vue";
const blocks = edidstore.mEEDID.CEA.DataBlocks;
const selectedBlock = ref(3);
const displayElement = ref("header");
import CEAHeader from "./cea/CEAHeader.vue";
import CEADataBlock from "./cea/CEADataBock.vue";
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
      <template v-for="(block, index) in blocks">
        <Toggle
          v-if="
            (block.Header.Type === 'DBUseExtendedTag') ||
              (block.Header.Type === 'DBVendorSpecificDataBlock')
          "
          @click="
            displayElement = 'block' + index;
            selectedBlock = index;
          "
          variant="ghost"
          class="w-full justify-start"
          :pressed="displayElement === 'block' + index"
          >{{ block.Content.ExtendedName }}</Toggle
        >
        <Toggle
          v-else
          @click="
            displayElement = 'block' + index;
            selectedBlock = index;
          "
          variant="ghost"
          class="w-full justify-start"
          :pressed="displayElement === 'block' + index"
          >{{ block.Header.Type }}</Toggle
        >
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
      <CEADataBlock v-else :blockNum="selectedBlock" />
    </ResizablePanel>
  </ResizablePanelGroup>
</template>
