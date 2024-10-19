<script setup lang="ts">
const prop = defineProps<{
  block: any;
  id: number;
}>();
import { Input } from "@/components/ui/input";
import { DescriptorType } from "../../../edidjs/edid_descriptors";
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { Button } from "@/components/ui/button";
import { CircleMinus, CogIcon } from "lucide-vue-next";
</script>

<template>
  <div class="grid grid-cols-2">
    <div class="content-center">Text:</div>
    <div class="content-center">
      <Input v-model="prop.block.text" @input="edidstore.updateEdid()" />
    </div>
  </div>
</template>
