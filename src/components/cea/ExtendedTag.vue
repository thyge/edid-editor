<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
const prop = defineProps<{
  blockNum: any;
}>();
const blocks = edidstore.mEEDID.CEA.DataBlocks;
import ColorimetryDataBlock from "./extended/ColorimetryDataBlock.vue";
</script>

<template>
    <ColorimetryDataBlock v-if="blocks[prop.blockNum].Content.ExtendedName === 'ColorimetryDB'" :blockNum="prop.blockNum" />
    <div v-else>Block not supported</div>
</template>
