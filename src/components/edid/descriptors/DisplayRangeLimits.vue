<script setup lang="ts">
import { ref } from "vue";
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const medid = edidstore.mEEDID.EDID;
const prop = defineProps<{
  num: number;
}>();
import { Table, TableBody, div, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const desc = medid.DisplayDescriptors[prop.num - 1];
</script>

<template>
  <div class="grid grid-cols-2 gap-2 p-4 m-4 border rounded">
    <div class="content-center">Min Vertical Rate</div>
    <div>{{ desc.Content.MinimumVerticalRate }} Hz</div>
    <div>Max Vertical Rate</div>
    <div>{{ desc.Content.MaximumVerticalRate }} Hz</div>
    <div class="content-center">Min Horizontal Rate</div>
    <div class="content-center">{{ desc.Content.MinimumHorizontalRate }} KHz</div>
    <div class="content-center">Max Horizontal Rate</div>
    <div class="content-center">{{ desc.Content.MaximumHorizontalRate }} KHz</div>
    <div class="content-center">Maximum Pixel Clock</div>
    <div class="content-center">{{ desc.Content.MaximumPixelClock }} MHz</div>
    <div class="content-center">VideoTimingSupportMode</div>
        <div class="content-center"><Select v-model="desc.Content.VideoTimingSupportMode">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DefaultGTF"> DefaultGTF </SelectItem>
            <SelectItem value="RangeLimitsOnly"> RangeLimitsOnly </SelectItem>
            <SelectItem value="SecondaryGTF"> SecondaryGTF </SelectItem>
            <SelectItem value="CVTSupported"> CVTSupported </SelectItem>
          </SelectContent>
        </Select>
      </div>
  </div>
</template>
