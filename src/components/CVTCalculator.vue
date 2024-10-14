<script setup lang="ts">
import Switch from "./ui/switch/Switch.vue";
import {
  DetailedTimingDescriptor,
  CVTMode,
} from "../edidjs/DetailedTimingDescriptor";
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
import { Label } from "@/components/ui/label";
import { ref } from "vue";
const dtd = ref(new DetailedTimingDescriptor());
const wanted_hori_active = ref(3840);
const wanted_vert_active = ref(2160);
const wanted_refresh_rate = ref(60);
const wanted_mode = ref(CVTMode.CVT_RB2);
const wanted_margins = ref(false);
let wanted_interlaced = ref(false);
function updateDtd() {
  dtd.value.ComputeTiming(
    wanted_hori_active.value,
    wanted_vert_active.value,
    wanted_refresh_rate.value,
    wanted_mode.value,
    wanted_margins.value,
    wanted_interlaced.value
  );
  console.log(dtd.value);
}
onload = () => {
  updateDtd();
};
</script>

<template>
  <div class="gap-2 p-4 m-4 border rounded">
    <div class="grid grid-cols-4 gap-2 p-2 m-2">
      <div class="content-center">CVT Mode</div>
      <Select
        id="CVT Mode"
        v-model="wanted_mode"
        @update:modelValue="updateDtd"
      >
        <SelectTrigger>
          <SelectValue></SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="non-cvt">non-cvt</SelectItem>
          <SelectItem value="CRT">CRT</SelectItem>
          <SelectItem value="cvt_rb">cvt_rb</SelectItem>
          <SelectItem value="cvt_rb2">cvt_rb2</SelectItem>
        </SelectContent>
      </Select>
      <div class="content-center">Interlaced</div>
      <div class="content-center">
        <Switch
          v-model:checked="wanted_interlaced"
          @update:checked="updateDtd"
        />
      </div>
    </div>
    <div class="grid grid-cols-2 gap-2 p-2 m-2">
      <NumberField
        id="hor_pix"
        :min="0"
        :step="1"
        v-model="wanted_hori_active"
        @update:modelValue="updateDtd"
      >
        <Label id="hor_pix">Horizontal Pixels</Label>
        <NumberFieldContent>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
      <NumberField
        id="ver_pix"
        :min="0"
        :step="1"
        v-model="wanted_vert_active"
        @update:modelValue="updateDtd"
      >
        <Label id="ver_pix">Vertical Lines</Label>
        <NumberFieldContent>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
      <NumberField
        id="pix_clk"
        v-model="dtd.PixelClockKHz"
        :format-options="{
          minimumFractionDigits: 2,
        }"
        :disabled="true"
      >
        <Label id="pix_clk">Pixel Clock</Label>
        <NumberFieldContent>
          <NumberFieldInput />
        </NumberFieldContent>
      </NumberField>
      <NumberField
        id="vert_hz"
        :min="0"
        :step="0.01"
        v-model="wanted_refresh_rate"
        @update:modelValue="updateDtd"
        :format-options="{
          minimumFractionDigits: 2,
        }"
      >
        <Label id="vert_hz">Vertical Hz</Label>
        <NumberFieldContent>
          <NumberFieldIncrement />
          <NumberFieldInput />
          <NumberFieldDecrement />
        </NumberFieldContent>
      </NumberField>
    </div>
    <div class="content-center gap-2 p-2 m-2">Calculated</div>
    <div class="grid grid-cols-2 gap-2 p-2 m-2">
      <div class="content-center">Horizontal</div>
      <div class="content-center">Vertical</div>
      <NumberField
        id="hor_active"
        v-model="dtd.HorizontalActive"
        :disabled="true"
      >
        <Label id="hor_active">Active Pixels</Label>
        <NumberFieldContent>
          <NumberFieldInput />
        </NumberFieldContent>
      </NumberField>
      <NumberField
        id="vert_active"
        v-model="dtd.VerticalActive"
        :disabled="true"
      >
        <Label id="vert_active">Active Pixels</Label>
        <NumberFieldContent>
          <NumberFieldInput />
        </NumberFieldContent>
      </NumberField>
      <NumberField
        id="hor_refresh_rate"
        v-model="dtd.HorizontalRefreshRate"
        :disabled="true"
      >
        <Label id="hor_refresh_rate">Refresh Rate</Label>
        <NumberFieldContent>
          <NumberFieldInput />
        </NumberFieldContent>
      </NumberField>
      <NumberField
        id="ver_refresh_rate"
        v-model="dtd.VerticalRefreshRate"
        :disabled="true"
      >
        <Label id="ver_refresh_rate">Refresh Rate</Label>
        <NumberFieldContent>
          <NumberFieldInput />
        </NumberFieldContent>
      </NumberField>
      <NumberField
        id="hor_blank"
        :min="0"
        :step="1"
        v-model="dtd.HorizontalBlanking"
        :disabled="true"
      >
        <Label id="hor_blank">Blanking</Label>
        <NumberFieldContent>
          <NumberFieldInput />
        </NumberFieldContent>
      </NumberField>
      <NumberField
        id="ver_blank"
        :min="0"
        :step="1"
        v-model="dtd.VerticalBlanking"
        :disabled="true"
      >
        <Label id="ver_blank">Blanking</Label>
        <NumberFieldContent>
          <NumberFieldInput />
        </NumberFieldContent>
      </NumberField>
      <NumberField
        id="hor_front_porch"
        v-model="dtd.HorizontalFrontPorch"
        :disabled="true"
      >
        <Label id="hor_front_porch">Front Porch</Label>
        <NumberFieldContent>
          <NumberFieldInput />
        </NumberFieldContent>
      </NumberField>
      <NumberField
        id="ver_front_porch"
        v-model="dtd.VerticalFrontPorch"
        :disabled="true"
      >
        <Label id="ver_front_porch">Front Porch</Label>
        <NumberFieldContent>
          <NumberFieldInput />
        </NumberFieldContent>
      </NumberField>
      <NumberField
        id="hor_sync_width"
        v-model="dtd.HorizontalSyncPulseWidth"
        :disabled="true"
      >
        <Label id="hor_sync_width">Sync Width</Label>
        <NumberFieldContent>
          <NumberFieldInput />
        </NumberFieldContent>
      </NumberField>
      <NumberField
        id="ver_sync_width"
        v-model="dtd.VerticalSyncPulseWidth"
        :disabled="true"
      >
        <Label id="ver_sync_width">Sync Width</Label>
        <NumberFieldContent>
          <NumberFieldInput />
        </NumberFieldContent>
      </NumberField>
    </div>
  </div>
</template>
