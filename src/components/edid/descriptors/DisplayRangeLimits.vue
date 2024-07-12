<script setup lang="ts">
import { ref } from "vue";
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const medid = edidstore.mEEDID.EDID;
const prop = defineProps<{
  num: number;
}>();
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
const desc = medid.DisplayDescriptors[prop.num - 1];
</script>

<template>
  <Table>
    <TableBody>
      <TableRow>
        <TableCell>Min Vertical Rate</TableCell>
        <TableCell>{{ desc.Content.MinimumVerticalRate }} Hz</TableCell>
        <TableCell>Max Vertical Rate</TableCell>
        <TableCell>{{ desc.Content.MaximumVerticalRate }} Hz</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Min Horizontal Rate</TableCell>
        <TableCell>{{ desc.Content.MinimumHorizontalRate }} KHz</TableCell>
        <TableCell>Max Horizontal Rate</TableCell>
        <TableCell>{{ desc.Content.MaximumHorizontalRate }} KHz</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Maximum Pixel Clock</TableCell>
        <TableCell>{{ desc.Content.MaximumPixelClock }} MHz</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>VideoTimingSupportMode</TableCell>
        <Select v-model="desc.Content.VideoTimingSupportMode">
          <SelectTrigger>
            <SelectValue  />
          </SelectTrigger>
          <SelectContent>
              <SelectItem value="DefaultGTF"> DefaultGTF </SelectItem>
              <SelectItem value="RangeLimitsOnly"> RangeLimitsOnly </SelectItem>
              <SelectItem value="SecondaryGTF"> SecondaryGTF </SelectItem>
              <SelectItem value="CVTSupported"> CVTSupported </SelectItem>
          </SelectContent>
        </Select>
      </TableRow>
    </TableBody>
  </Table>
</template>
