<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const prop = defineProps<{
  blockNum: number;
}>();
const blocks = edidstore.mEEDID.CEA.DataBlocks;
import VideoDataBlock from "./VideoDataBlock.vue";
import AudioDataBlock from "./AudioDataBlock.vue";
import VSDB from "./VSDB.vue";
import SpeakerAllocationDataBlock from "./SpeakerAllocationDataBlock.vue";
import ExtendedTag from "./ExtendedTag.vue";
import { CEADataBlockType } from "../../edidjs/cea";
</script>

<template>
  <VideoDataBlock
    :blockNum="blockNum"
    v-if="blocks[blockNum].Header.Type === CEADataBlockType.DBVideoDataBlock"
  />
  <AudioDataBlock
    :blockNum="blockNum"
    v-else-if="
      blocks[blockNum].Header.Type === CEADataBlockType.DBAudioDataBlock
    "
  />
  <VSDB
    :blockNum="blockNum"
    v-else-if="
      blocks[blockNum].Header.Type ===
      CEADataBlockType.DBVendorSpecificDataBlock
    "
  />
  <SpeakerAllocationDataBlock
    :blockNum="blockNum"
    v-else-if="
      blocks[blockNum].Header.Type ===
      CEADataBlockType.DBSpeakerAllocationData
    "
  />
  <ExtendedTag
    :blockNum="blockNum"
    v-else-if="
      blocks[blockNum].Header.Type === CEADataBlockType.DBUseExtendedTag
    "
  />
</template>
