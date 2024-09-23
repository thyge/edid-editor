<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const prop = defineProps<{
  blockNum: number;
}>();
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
const blocks = edidstore.mEEDID.CEA.DataBlocks;
import VideoDataBlock from "./VideoDataBlock.vue";
import ExtendedTag from "./ExtendedTag.vue";
import VSDB from "./VSDB.vue";
import DetailedTimingDesciptor from "../edid/DetailedTimingDesciptor.vue";
import { CEADataBlockType } from "../../edidjs/cea";
</script>

<template>
  <VideoDataBlock
    :blockNum="blockNum"
    v-if="blocks[blockNum].Header.Type === CEADataBlockType.DBVideoDataBlock"
  />
  <ExtendedTag
    :blockNum="blockNum"
    v-else-if="blocks[blockNum].Header.Type === CEADataBlockType.DBUseExtendedTag"
  />
  <VSDB
    :blockNum="blockNum"
    v-else-if="blocks[blockNum].Header.Type === CEADataBlockType.DBVendorSpecificDataBlock"
  />
</template>
