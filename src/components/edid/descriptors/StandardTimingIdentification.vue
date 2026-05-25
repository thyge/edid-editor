<script setup lang="ts">
import { StandardTimingIdentification } from "edidts";
import StandardTiming from "../StandardTiming.vue";
defineProps<{ block: StandardTimingIdentification }>();
</script>

<template>
  <template v-for="(timing, tIndex) in block.timings" :key="tIndex">
    <StandardTiming :id="tIndex + 8" :timing="timing" />
  </template>
</template>
