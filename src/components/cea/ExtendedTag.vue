<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const prop = defineProps<{
  blockNum: any;
}>();
const blocks = edidstore.mEEDID.CEA.DataBlocks;
import ColorimetryDataBlock from "./extended/ColorimetryDataBlock.vue";
import HDRStaticMetadataDataBlock from "./extended/HDRStaticMetadataDataBlock.vue";
import VideoCapabilityDataBlock from "./extended/VideoCapabilityDataBlock.vue";
</script>

<template>
  <ColorimetryDataBlock
    v-if="blocks[prop.blockNum].Content.ExtendedName === 'ColorimetryDB'"
    :blockNum="prop.blockNum"
  />
  <HDRStaticMetadataDataBlock
    v-else-if="
      blocks[prop.blockNum].Content.ExtendedName === 'HDRStaticMetadataDB'
    "
    :blockNum="prop.blockNum"
  />
  <VideoCapabilityDataBlock
    v-else-if="
      blocks[prop.blockNum].Content.ExtendedName === 'VideoCapabilityDB'
    "
    :blockNum="prop.blockNum"
  />
  <div v-else>{{ blocks[prop.blockNum].Content }}</div>
</template>
