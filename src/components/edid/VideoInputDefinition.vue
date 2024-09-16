<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { watch } from "vue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
const videoInDef = edidstore.mEEDID.EDID.VideoInputDefinition;
watch(
  () => edidstore.mEEDID.EDID.VideoInputDefinition.VideoSignalInterface,
  () => {
    edidstore.setHeader();
  }
);
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div class="content-center">Video Signal Interface</div>
    <div class="content-center">
      <Select
        v-model="videoInDef.VideoSignalInterface"
        @change="edidstore.setHeader"
      >
        <SelectTrigger>
          <SelectValue></SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Analog">Analog</SelectItem>
          <SelectItem value="Digital">Digital</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  <div
    v-if="videoInDef.VideoSignalInterface === 'Digital'"
    class="grid grid-cols-3 gap-2 p-4 m-4 border rounded"
  >
    <div class="content-center">Display Bitdepth</div>
    <div class="content-center">
      <Select
        id="select-bitdepth"
        v-model="videoInDef.BitDepth"
        @change="edidstore.setHeader"
      >
        <SelectTrigger :disabled="edidstore.mEEDID.EDID.Revision < 4">
          <SelectValue></SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="undefined">undefined</SelectItem>
          <SelectItem value="6">6</SelectItem>
          <SelectItem value="8">8</SelectItem>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="12">12</SelectItem>
          <SelectItem value="16">16</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="content-center">EDID 1.4 Only</div>
    <div class="content-center">Display Interface</div>
    <div class="content-center">
      <Select v-model="edidstore.mEEDID.EDID.VideoInterface">
        <SelectTrigger :disabled="edidstore.mEEDID.EDID.Revision < 4">
          <SelectValue></SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="undefined">undefined</SelectItem>
          <SelectItem value="DVI">DVI</SelectItem>
          <SelectItem value="HDMIa">HDMIa</SelectItem>
          <SelectItem value="HDMIb">HDMIb</SelectItem>
          <SelectItem value="MDDI">MDDI</SelectItem>
          <SelectItem value="DisplayPort">DisplayPort</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="content-center">EDID 1.4 Only</div>
    <div class="content-center">RGB 4:4:4 + YCrCb 4:4:4</div>
    <div class="content-center">
      <Switch
        :disabled="edidstore.mEEDID.EDID.Revision < 4"
        v-model="edidstore.mEEDID.EDID.ColourEncoding.YUV444"
      />
    </div>
    <div class="content-center">EDID 1.4 Only</div>
    <div class="content-center">RGB 4:4:4 + YCrCb 4:2:2</div>
    <div class="content-center">
      <Switch
        :disabled="edidstore.mEEDID.EDID.Revision < 4"
        v-model="edidstore.mEEDID.EDID.ColourEncoding.YUV422"
      />
    </div>
    <div class="content-center">EDID 1.4 Only</div>
  </div>
  <div v-else-if="videoInDef.VideoSignalInterface === 'Analog'" class="grid grid-cols-3 gap-2 p-4 m-4 border rounded">
      <div class="content-center">Analog not supported</div>
  </div>
</template>
