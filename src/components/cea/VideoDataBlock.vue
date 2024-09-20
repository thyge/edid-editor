<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const prop = defineProps<{
  blockNum: any;
}>();
const block = edidstore.mEEDID.CEA.DataBlocks[prop.blockNum];
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div class="content-center">Video Data Block</div>
  </div>
  <div class="grid grid-cols-6 gap-2 m-4 p-4 border rounded">
    <div class="content-center">Name</div>
    <div class="content-center">VIC</div>
    <div class="content-center">PixelClock</div>
    <div class="content-center col-span-3">Description</div>
    <template v-for="vic in block.Content.VICs">
      <div class="content-center">{{ vic.Name }}</div>
      <div class="content-center">{{ vic.VIC }}</div>
      <div class="content-center">{{ vic.PixelMHz }} MHz</div>
      <div class="content-center col-span-3">{{ vic.Description }}</div>
    </template>
  </div>
</template>
