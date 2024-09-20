<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const prop = defineProps<{
  blockNum: any;
}>();
const blocks = edidstore.mEEDID.CEA.DataBlocks;
import HDMI1_4 from "./vsdb/HDMI1_4.vue";
import HDMI2_0 from "./vsdb/HDMI2_0.vue";
</script>

<template>
  <HDMI1_4
    v-if="blocks[prop.blockNum].Content.ExtendedName === 'HDMI 1.4'"
    :blockNum="prop.blockNum"
  />
  <HDMI2_0
    v-else-if="blocks[prop.blockNum].Content.ExtendedName === 'HDMI 2.0'"
    :blockNum="prop.blockNum"
  />
</template>
