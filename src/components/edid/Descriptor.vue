<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const medid = edidstore.mEEDID.EDID;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DetailedTimingDescriptor from "./DetailedTimingDesciptor.vue";
const prop = defineProps<{
  num: number;
}>();
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import ASCIIDescriptor from "./descriptors/ASCIIDescriptor.vue";
import DisplayRangeLimits from "./descriptors/DisplayRangeLimits.vue";
</script>

<template>
  <DetailedTimingDescriptor
    v-if="
      medid.DisplayDescriptors[prop.num - 1].Type ===
      'Detailed Timing Descriptor'
    "
    :block="medid.DisplayDescriptors[prop.num - 1]"
  />
  <Card v-else>
    <CardHeader>
      <CardTitle class="text-sm font-medium"
        >{{ medid.DisplayDescriptors[prop.num - 1].Type }} -
        {{ prop.num }}</CardTitle
      >
    </CardHeader>
    <CardContent>
      <ASCIIDescriptor
        v-if="
          medid.DisplayDescriptors[prop.num - 1].Type ===
          'Display serial number (ASCII text)'
        "
        :num="prop.num"
      />
      <ASCIIDescriptor
        v-if="
          medid.DisplayDescriptors[prop.num - 1].Type ===
          'Display serial number (ASCII text)'
        "
        :num="prop.num"
      />
      <ASCIIDescriptor
        v-if="
          medid.DisplayDescriptors[prop.num - 1].Type ===
          'Unspecified text (ASCII text)'
        "
        :num="prop.num"
      />
      <ASCIIDescriptor
        v-if="
          medid.DisplayDescriptors[prop.num - 1].Type === 'Display Product Name'
        "
        :num="prop.num"
      />
      <DisplayRangeLimits
        v-if="
          medid.DisplayDescriptors[prop.num - 1].Type === 'Display Range Limits'
        "
        :num="prop.num"
      />
      <TableBody
        v-if="
          medid.DisplayDescriptors[prop.num - 1].Type === 'Color Point Data'
        "
      >
        <TableRow>
          <TableCell>{{
            medid.DisplayDescriptors[prop.num - 1].Type
          }}</TableCell>
        </TableRow>
      </TableBody>
      <TableBody
        v-if="
          medid.DisplayDescriptors[prop.num - 1].Type ===
          'Standard Timing Definitions'
        "
      >
        <TableRow>
          <TableCell>{{
            medid.DisplayDescriptors[prop.num - 1].Type
          }}</TableCell>
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
            >EDID 1.4
            {{ medid.DisplayDescriptors[prop.num - 1].Type }}</TableCell
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
            >EDID 1.4
            {{ medid.DisplayDescriptors[prop.num - 1].Type }}</TableCell
          >
        </TableRow>
      </TableBody>
      <TableBody
        v-if="
          medid.DisplayDescriptors[prop.num - 1].Type === 'Dummy Identifier'
        "
      >
        <TableRow>
          <TableCell
            >EDID 1.4
            {{ medid.DisplayDescriptors[prop.num - 1].Type }}</TableCell
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
            >EDID 1.4
            {{ medid.DisplayDescriptors[prop.num - 1].Type }}</TableCell
          >
        </TableRow>
      </TableBody>
      <TableBody
        v-if="medid.DisplayDescriptors[prop.num - 1].Type === 'Reserved'"
      >
        <TableRow>
          <TableCell
            >EDID 1.4
            {{ medid.DisplayDescriptors[prop.num - 1].Type }}</TableCell
          >
        </TableRow>
      </TableBody>
    </CardContent>
  </Card>
</template>
