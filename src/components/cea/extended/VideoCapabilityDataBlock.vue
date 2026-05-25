<script setup lang="ts">
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VideoCapabilityDataBlock } from "@/edidts";
const prop = defineProps<{
  block: VideoCapabilityDataBlock;
}>();
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div class="content-center">{{ block.Header.Name }}</div>
  </div>
  <div class="grid grid-cols-3 gap-2 m-4 p-4 border rounded">
    <div class="content-center">YCC Quantization Range Selectable</div>
    <div>
      <Switch
        v-model:checked="
          block.YCCQuantizationRangeSelectable
        "
      />
    </div>
    <div></div>
    <div class="content-center">RGB Quantization Range Selectable</div>
    <div>
      <Switch
        v-model:checked="
          block.RGBQuantizationRangeSelectable
        "
      />
    </div>
    <div></div>
    <div class="content-center">PT Overscan Behavior</div>
    <div>
      <Select
        v-model="block.PTOverscanBehavior"
        disabled
      >
        <SelectTrigger>
          <SelectValue> </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Supports both over and underscan"
            >Supports both over and underscan</SelectItem
          >
          <SelectItem value="Always Underscanned"
            >Always Underscanned</SelectItem
          >
          <SelectItem value="Always Overscanned"
            >"Always Overscanned"</SelectItem
          >
          <SelectItem value="No Data">No Data</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div></div>
    <div class="content-center">IT Overscan Behavior</div>
    <div>
      <Select
        v-model="block.ITOverscanBehavior"
        disabled
      >
        <SelectTrigger>
          <SelectValue> </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Supports both over and underscan"
            >Supports both over and underscan</SelectItem
          >
          <SelectItem value="Always Underscanned"
            >Always Underscanned</SelectItem
          >
          <SelectItem value="Always Overscanned"
            >"Always Overscanned"</SelectItem
          >
          <SelectItem value="IT Video Formats not supported"
            >IT Video Formats not supported</SelectItem
          >
        </SelectContent>
      </Select>
    </div>
    <div></div>
    <div class="content-center">CE Overscan Behavior</div>
    <div>
      <Select
        v-model="block.CEOverscanBehavior"
        disabled
      >
        <SelectTrigger>
          <SelectValue> </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Supports both over and underscan"
            >Supports both over and underscan</SelectItem
          >
          <SelectItem value="Always Underscanned"
            >Always Underscanned</SelectItem
          >
          <SelectItem value="Always Overscanned"
            >"Always Overscanned"</SelectItem
          >
          <SelectItem value="CE Video Formats not supported"
            >CE Video Formats not supported</SelectItem
          >
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
