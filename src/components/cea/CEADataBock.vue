<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const prop = defineProps<{
  blockNum: number;
}>();
const block = edidstore.mEEDID.CEA.DataBlocks[prop.blockNum]!;
import VideoDataBlock from "./VideoDataBlock.vue";
import AudioDataBlock from "./AudioDataBlock.vue";
import VSDB from "./VSDB.vue";
import SpeakerAllocationDataBlock from "./SpeakerAllocationDataBlock.vue";
import ExtendedTag from "./ExtendedTag.vue";
</script>

<template>
  <VideoDataBlock
    :block="block"
    v-if="block.kind === 'video'"
  />
  <AudioDataBlock
    :block="block"
    v-else-if="block.kind === 'audio'"
  />
  <VSDB
    :block="block"
    v-else-if="block.kind === 'vsdb'"
  />
  <SpeakerAllocationDataBlock
    :block="block"
    v-else-if="block.kind === 'speaker'"
  />
  <ExtendedTag
    :block="block"
    v-else-if="block.kind === 'extended'"
  />
</template>
