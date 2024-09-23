<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const prop = defineProps<{
  blockNum: any;
}>();
const block = edidstore.mEEDID.CEA.DataBlocks[prop.blockNum];
</script>

<template>
  {{ block }}
</template>
