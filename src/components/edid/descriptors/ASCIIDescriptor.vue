<script setup lang="ts">
const prop = defineProps<{
  block: any;
  id: number;
}>();
import { Input } from "@/components/ui/input";
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
</script>

<template>
  <div class="grid grid-cols-2">
    <div class="content-center">Text:</div>
    <div class="content-center">
      <Input v-model="prop.block.text" @input="edidstore.updateEdid()" />
    </div>
  </div>
</template>
