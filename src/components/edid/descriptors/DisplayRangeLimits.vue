<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const medid = edidstore.mEEDID.EDID;
const prop = defineProps<{
  num: number;
}>();
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
const desc = medid.DisplayDescriptors[prop.num - 1];
</script>

<template>
  <div class="grid grid-cols-2 gap-2 p-4 m-4 border rounded">
    <div class="content-center">Min Vertical Rate Hz</div>
    <NumberField v-model="desc.MinimumVerticalRate" :disabled="true">
      <NumberFieldContent>
        <NumberFieldIncrement />
        <NumberFieldInput />
        <NumberFieldDecrement />
      </NumberFieldContent>
    </NumberField>
    <div>Max Vertical Rate Hz</div>
    <div>
      <NumberField v-model="desc.MaximumVerticalRate" :disabled="true">
        <NumberFieldContent>
          <NumberFieldIncrement />
          <NumberFieldInput />
          <NumberFieldDecrement />
        </NumberFieldContent>
      </NumberField>
    </div>
    <div class="content-center">Min Horizontal Rate KHz</div>
    <div class="content-center">
      <NumberField v-model="desc.MinimumHorizontalRate" :disabled="true">
        <NumberFieldContent>
          <NumberFieldIncrement />
          <NumberFieldInput />
          <NumberFieldDecrement />
        </NumberFieldContent>
      </NumberField>
    </div>
    <div class="content-center">Max Horizontal Rate KHz</div>
    <div class="content-center">
      <NumberField v-model="desc.MaximumHorizontalRate" :disabled="true">
        <NumberFieldContent>
          <NumberFieldIncrement />
          <NumberFieldInput />
          <NumberFieldDecrement />
        </NumberFieldContent>
      </NumberField>
    </div>
    <div class="content-center">Maximum Pixel Clock MHz</div>
    <div class="content-center">
      <NumberField v-model="desc.MaximumPixelClockMHz" :disabled="true">
        <NumberFieldContent>
          <NumberFieldIncrement />
          <NumberFieldInput />
          <NumberFieldDecrement />
        </NumberFieldContent>
      </NumberField>
    </div>
    <div class="content-center">VideoTimingSupportMode</div>
    <div class="content-center">
      <Select v-model="desc.VideoTimingSupport">
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
    <div v-if="desc.VideoTimingSupport === 'CVTSupported'">
      <div class="content-center">CVT Support Definition</div>
      {{ desc.CVTSupportDefinition }}
    </div>
  </div>
</template>
