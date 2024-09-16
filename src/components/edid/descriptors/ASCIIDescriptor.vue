<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const medid = edidstore.mEEDID.EDID;
const prop = defineProps<{
  num: number;
}>();
import { Input } from "@/components/ui/input";
</script>

<template>
  <div class="grid grid-cols-3 gap-2 p-4 m-4 border rounded">
    <div class="content-center"> Text </div>
    <div class="content-center col-span-2">
      <Input v-model="medid.DisplayDescriptors[prop.num - 1].Content" />
    </div>
  </div>
</template>
