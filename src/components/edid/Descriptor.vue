<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const medid = edidstore.mEEDID.EDID;
import DetailedTimingDescriptor from "../DetailedTimingDesciptor.vue";
import { Trash, CirclePlus, Minus, CircleMinus } from "lucide-vue-next";
const prop = defineProps<{
  num: number;
}>();
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DescriptorType } from "../../edidjs/edid_descriptors";
import ASCIIDescriptor from "./descriptors/ASCIIDescriptor.vue";
import DisplayRangeLimits from "./descriptors/DisplayRangeLimits.vue";
function handleRemoveBlock() {
  console.log("removing block");
}
function handleAddBlock() {
  console.log("add block diag");
}
</script>

<template>
  <DetailedTimingDescriptor
    v-if="
      medid.DisplayDescriptors[prop.num - 1].Type ===
      DescriptorType.DetailedTimingDescriptor
    "
    :block="medid.DisplayDescriptors[prop.num - 1]"
  />
  <div v-else>
    <div class="grid grid-cols-4 gap-2 m-4">
      <div class="content-center col-span-3">
        {{ DescriptorType[medid.DisplayDescriptors[prop.num - 1].Type] }}
      </div>
      <div class="content-center">
        <Button @click="handleRemoveBlock()" variant="ghost" size="icon">
          <CircleMinus />
        </Button>
      </div>
    </div>
    <ASCIIDescriptor
      v-if="
        medid.DisplayDescriptors[prop.num - 1].Type ===
          DescriptorType.DisplayProductSerialNumber ||
        medid.DisplayDescriptors[prop.num - 1].Type ===
          DescriptorType.AlphanumericDataString ||
        medid.DisplayDescriptors[prop.num - 1].Type ===
          DescriptorType.DisplayProductName
      "
      :num="prop.num"
    />
    <DisplayRangeLimits
      v-if="
        medid.DisplayDescriptors[prop.num - 1].Type === DescriptorType.DisplayRangeLimits
      "
      :num="prop.num"
    />
    <TableBody
      v-if="medid.DisplayDescriptors[prop.num - 1].Type === 'Color Point Data'"
    >
      <TableRow>
        <TableCell>{{ medid.DisplayDescriptors[prop.num - 1].Type }}</TableCell>
      </TableRow>
    </TableBody>
    <TableBody
      v-if="
        medid.DisplayDescriptors[prop.num - 1].Type ===
        'Standard Timing Definitions'
      "
    >
      <TableRow>
        <TableCell>{{ medid.DisplayDescriptors[prop.num - 1].Type }}</TableCell>
      </TableRow>
    </TableBody>
    <TableBody
      v-if="
        medid.DisplayDescriptors[prop.num - 1].Type ===
        'Display Color Management (DCM)'
      "
    >
      <TableRow>
        <TableCell>
          {{ medid.DisplayDescriptors[prop.num - 1].Type }}</TableCell
        >
      </TableRow>
    </TableBody>
    <TableBody
      v-if="
        medid.DisplayDescriptors[prop.num - 1].Type ===
        'CVT 3-Byte Timing Codes'
      "
    >
      <TableRow>
        <TableCell
          >EDID 1.4 {{ medid.DisplayDescriptors[prop.num - 1].Type }}</TableCell
        >
      </TableRow>
    </TableBody>
    <TableBody
      v-if="
        medid.DisplayDescriptors[prop.num - 1].Type ===
        'Established Timings III'
      "
    >
      <TableRow>
        <TableCell
          >EDID 1.4 {{ medid.DisplayDescriptors[prop.num - 1].Type }}</TableCell
        >
      </TableRow>
    </TableBody>
    <TableBody
      v-if="medid.DisplayDescriptors[prop.num - 1].Type === 'Dummy Identifier'"
    >
      <TableRow>
        <TableCell
          >EDID 1.4 {{ medid.DisplayDescriptors[prop.num - 1].Type }}</TableCell
        >
      </TableRow>
    </TableBody>
    <TableBody
      v-if="
        medid.DisplayDescriptors[prop.num - 1].Type ===
        'Manufacturer Specified Display Descriptors'
      "
    >
      <TableRow>
        <TableCell
          >EDID 1.4 {{ medid.DisplayDescriptors[prop.num - 1].Type }}</TableCell
        >
      </TableRow>
    </TableBody>
    <TableBody
      v-if="medid.DisplayDescriptors[prop.num - 1].Type === 'Reserved'"
    >
      <TableRow>
        <TableCell
          >EDID 1.4 {{ medid.DisplayDescriptors[prop.num - 1].Type }}</TableCell
        >
      </TableRow>
    </TableBody>
  </div>
</template>
