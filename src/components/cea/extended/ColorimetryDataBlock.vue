<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const prop = defineProps<{
  blockNum: any;
}>();
const blocks = edidstore.mEEDID.CEA.DataBlocks;
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div class="content-center">Colorimetry Data Block</div>
  </div>
  <div class="grid grid-cols-3 gap-2 m-4 p-4 border rounded">
    <div class="content-center">Content</div>
  </div>
</template>
