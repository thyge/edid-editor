<script setup lang="ts">
import { CVT3ByteCodes } from "edidts";
defineProps<{ block: CVT3ByteCodes }>();
</script>

<template>
  <div class="grid grid-cols-4 gap-2 m-4">
    <div class="content-center col-span-3">
      {{ block }}
    </div>
  </div>
</template>
