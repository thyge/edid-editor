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
  <div>
    <div class="grid grid-cols-3 gap-2 p-4 m-4 border rounded">
      <div class="content-center">Text:</div>
      <div class="content-center col-span-2">
        <Input v-model="prop.block.text" @input="edidstore.updateEdid()" />
      </div>
    </div>
  </div>
</template>
