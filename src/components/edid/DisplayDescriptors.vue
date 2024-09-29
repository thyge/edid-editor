<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import DetailedTimingDescriptor from "../DetailedTimingDesciptor.vue";
import { DescriptorType } from "../../edidjs/edid_descriptors";
import ASCIIDescriptor from "./descriptors/ASCIIDescriptor.vue";
import DisplayRangeLimits from "./descriptors/DisplayRangeLimits.vue";
import { Button } from "@/components/ui/button";
import { CircleMinus, CogIcon } from "lucide-vue-next";
function handleRemoveBlock() {
  console.log("removing block");
}
function handleAddBlock() {
  console.log("add block diag");
}
</script>

<template>
  <div class="grid gap-1">
    <template
      v-for="(block, index) in edidstore.mEEDID.EDID.DisplayDescriptors"
    >
      <DetailedTimingDescriptor
        v-if="block.Type === DescriptorType.DetailedTimingDescriptor"
        :block="block"
        :id="index"
      />
      <ASCIIDescriptor
        v-else-if="
          block.Type === DescriptorType.DisplayProductSerialNumber ||
          block.Type === DescriptorType.AlphanumericDataString ||
          block.Type === DescriptorType.DisplayProductName
        "
        :block="block"
        :id="index"
      />
      <DisplayRangeLimits
        v-else-if="block.Type === DescriptorType.DisplayRangeLimits"
        :block="block"
        :id="index"
      />
      <div v-else-if="block.Type === DescriptorType.Dummy">
        <div class="content-center">Dummy Descriptor</div>
        <div class="grid grid-cols-2 gap-2 m-4">
          <Button variant="ghost" @click="edidstore.removeBlock(index)">
            <CircleMinus />
          </Button>
          <Button variant="ghost" @click="edidstore.changeBlock(id)">
            <CogIcon
          /></Button>
        </div>
      </div>
      <div v-else>
        <div class="grid grid-cols-4 gap-2 m-4">
          <div class="content-center col-span-3">
            {{ block.Type }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
