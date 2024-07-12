<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import Descriptor from "./Descriptor.vue";
</script>

<template>
  <div class="grid gap-1 md:grid-cols-1 lg:grid-cols-2">
    <Descriptor v-for="i in 4" :num="i"></Descriptor>
  </div>
</template>
