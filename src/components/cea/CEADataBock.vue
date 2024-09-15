<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const prop = defineProps<{
  blockNum: any;
}>();
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
const blocks = edidstore.mEEDID.CEA.DataBlocks;
import VideoDataBlock from "./VideoDataBlock.vue";
import ExtendedTag from "./ExtendedTag.vue";
import VSDB from "./VSDB.vue";
import DetailedTimingDesciptor from "../edid/DetailedTimingDesciptor.vue";
</script>

<template>
  <VideoDataBlock
    :blockNum="blockNum"
    v-if="blocks[blockNum].Header.Type === 'DBVideoDataBlock'"
  />
  <ExtendedTag
    :blockNum="blockNum"
    v-else-if="blocks[blockNum].Header.Type === 'DBUseExtendedTag'"
  />
  <VSDB
    :blockNum="blockNum"
    v-else-if="blocks[blockNum].Header.Type === 'DBVendorSpecificDataBlock'"
  />
  <CardContent
    v-else-if="blocks[blockNum].Header.Type === 'DetailedTimingDescriptor'"
  >
    <DetailedTimingDesciptor
      :num="blockNum"
      :block="blocks[blockNum].Content"
    />
  </CardContent>
</template>
