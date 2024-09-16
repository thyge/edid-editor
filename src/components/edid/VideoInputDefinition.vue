<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { watch } from "vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
    <div>Video Signal Interface</div>
    <div>
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
    <div>Display Bitdepth</div>
    <div>
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
    <div>EDID 1.4 Only</div>
    <div>Display Interface</div>
    <div>
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
    <div>EDID 1.4 Only</div>
    <div>RGB 4:4:4 + YCrCb 4:4:4</div>
    <div>
      <Switch
        :disabled="edidstore.mEEDID.EDID.Revision < 4"
        v-model="edidstore.mEEDID.EDID.ColourEncoding.YUV444"
      />
    </div>
    <div>EDID 1.4 Only</div>
    <div>RGB 4:4:4 + YCrCb 4:2:2</div>
    <div>
      <Switch
        :disabled="edidstore.mEEDID.EDID.Revision < 4"
        v-model="edidstore.mEEDID.EDID.ColourEncoding.YUV422"
      />
    </div>
    <div>EDID 1.4 Only</div>
  </div>
  <div v-else-if="videoInDef.VideoSignalInterface === 'Analog'" class="grid grid-cols-3 gap-2 p-4 m-4 border rounded">
      <div>Analog not supported</div>
  </div>
</template>
