<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import VideoInputDefinitionFeatureSupport from "./VideoInputDefinitionFeatureSupport.vue";
import VideoInputDefinition from "./VideoInputDefinition.vue";
</script>

<template>
  <VideoInputDefinition />

  <div class="grid grid-cols-3 gap-2 m-4">
    <div>Display Parameters</div>
  </div>
  <div class="grid grid-cols-3 gap-2 p-4 m-4 border rounded">
    <div>Display Size</div>
    <div>
      {{ edidstore.mEEDID.EDID.HorizontalSizeCM }}cm x
      {{ edidstore.mEEDID.EDID.VerticalSizeCM }}cm
    </div>
    <div></div>
    <div>Display Gamma</div>
    <div>{{ edidstore.mEEDID.EDID.Gamma }}</div>
  </div>

  <VideoInputDefinitionFeatureSupport />
</template>
