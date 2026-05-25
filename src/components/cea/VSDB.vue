<script setup lang="ts">
import type { VSDBUnion } from "@/edidts";
import HDMI1_4 from "./vsdb/HDMI1_4.vue";
import HDMI2_0 from "./vsdb/HDMI2_0.vue";
const prop = defineProps<{
  block: VSDBUnion;
}>();
</script>

<template>
  <HDMI1_4
    v-if="block.vsdbKind === 'hdmi14'"
    :block="block"
  />
  <HDMI2_0
    v-else-if="block.vsdbKind === 'hdmi20'"
    :block="block"
  />
</template>
