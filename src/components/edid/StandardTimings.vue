<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import StandardTiming from "./StandardTiming.vue";
</script>

<template>
  <div class="grid md:grid-cols-1 lg:grid-cols-2">
    <StandardTiming
      v-for="(timing, index) in edidstore.mEEDID.EDID.StandardTimings"
      :id="index"
    />
  </div>
</template>
