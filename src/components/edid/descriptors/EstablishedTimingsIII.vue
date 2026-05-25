<script setup lang="ts">
import { EstablishedTimingsIII } from "edidts";
defineProps<{ block: EstablishedTimingsIII }>();
</script>

<template>
  <div class="grid grid-cols-4 gap-2 m-4">
    <div class="content-center col-span-3">
      {{ block }}
    </div>
  </div>
</template>
