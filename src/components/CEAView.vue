<script setup lang="ts">
import { ref } from "vue";
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash, CirclePlus, Minus } from "lucide-vue-next";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
  <div class="grid grid-cols-6 gap-1 h-screen">
    <Card class="col-span-2">
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
            (block.Header.Type === 'DBUseExtendedTag') |
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
    </Card>
    <CEAHeader v-if="displayElement === 'header'" class="col-span-4" />
    <CEADataBlock v-else class="col-span-4" :blockNum="selectedBlock" />
  </div>
</template>
