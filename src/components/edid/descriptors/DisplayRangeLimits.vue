<script setup lang="ts">
const prop = defineProps<{
  block: any;
  id: number;
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
import { Button } from "@/components/ui/button";
import { CircleMinus, CogIcon } from "lucide-vue-next";
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
</script>

<template>
  <div class="grid grid-cols-2 gap-2 p-4 m-4 border rounded">
    <div class="content-center">Min Vertical Rate Hz</div>
    <NumberField v-model="prop.block.MinimumVerticalRate" :disabled="true">
      <NumberFieldContent>
        <NumberFieldIncrement />
        <NumberFieldInput />
        <NumberFieldDecrement />
      </NumberFieldContent>
    </NumberField>
    <div>Max Vertical Rate Hz</div>
    <div>
      <NumberField v-model="prop.block.MaximumVerticalRate" :disabled="true">
        <NumberFieldContent>
          <NumberFieldIncrement />
          <NumberFieldInput />
          <NumberFieldDecrement />
        </NumberFieldContent>
      </NumberField>
    </div>
    <div class="content-center">Min Horizontal Rate KHz</div>
    <div class="content-center">
      <NumberField v-model="prop.block.MinimumHorizontalRate" :disabled="true">
        <NumberFieldContent>
          <NumberFieldIncrement />
          <NumberFieldInput />
          <NumberFieldDecrement />
        </NumberFieldContent>
      </NumberField>
    </div>
    <div class="content-center">Max Horizontal Rate KHz</div>
    <div class="content-center">
      <NumberField v-model="prop.block.MaximumHorizontalRate" :disabled="true">
        <NumberFieldContent>
          <NumberFieldIncrement />
          <NumberFieldInput />
          <NumberFieldDecrement />
        </NumberFieldContent>
      </NumberField>
    </div>
    <div class="content-center">Maximum Pixel Clock MHz</div>
    <div class="content-center">
      <NumberField v-model="prop.block.MaximumPixelClockMHz" :disabled="true">
        <NumberFieldContent>
          <NumberFieldIncrement />
          <NumberFieldInput />
          <NumberFieldDecrement />
        </NumberFieldContent>
      </NumberField>
    </div>
    <div class="content-center">VideoTimingSupportMode</div>
    <div class="content-center">
      <Select
        v-model="prop.block.VideoTimingSupport"
        @update:modelValue="edidstore.updateEdid()"
      >
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
    <div v-if="prop.block.VideoTimingSupport === 'CVTSupported'">
      <div class="content-center">CVT Support Definition</div>
      {{ prop.block.CVTSupportDefinition }}
    </div>
  </div>
</template>
