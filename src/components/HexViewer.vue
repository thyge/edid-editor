<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const prop = defineProps(
  {
    data: {
      type: Uint8Array,
      required: true,
    },
  }
);
</script>

<template>
  <div class="grid grid-cols-8">
    <template v-for="(byte, index) in prop.data">
      <div class="w-6 h-6 flex items-center justify-center">
        {{ byte.toString(16).toUpperCase() }}
      </div>
    </template>
  </div>
</template>
