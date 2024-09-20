<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const prop = defineProps<{
  blockNum: any;
}>();
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const blocks = edidstore.mEEDID.CEA.DataBlocks;
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div class="content-center">Video Capability Data Block</div>
  </div>
  <div class="grid grid-cols-3 gap-2 m-4 p-4 border rounded">
    <div class="content-center">YCC Quantization Range Selectable</div>
    <div>
      <Switch
        v-model:checked="
          blocks[prop.blockNum].Content.YCCQuantizationRangeSelectable
        "
      />
    </div>
    <div></div>
    <div class="content-center">RGB Quantization Range Selectable</div>
    <div>
      <Switch
        v-model:checked="
          blocks[prop.blockNum].Content.RGBQuantizationRangeSelectable
        "
      />
    </div>
    <div></div>
    <div class="content-center">PT Overscan Behavior</div>
    <div>
      <Select
        v-model="blocks[prop.blockNum].Content.PTOverscanBehavior"
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
        v-model="blocks[prop.blockNum].Content.ITOverscanBehavior"
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
        v-model="blocks[prop.blockNum].Content.CEOverscanBehavior"
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
