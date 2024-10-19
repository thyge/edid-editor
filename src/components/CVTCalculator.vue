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
const prop = defineProps<{
  block: DetailedTimingDescriptor;
}>();
const dtd = new DetailedTimingDescriptor();
dtd.cloneFrom(prop.block);
const wanted_hori_active = dtd.HorizontalActive;
const wanted_vert_active = dtd.VerticalActive;
const wanted_refresh_rate = dtd.VerticalRefreshRate;
const wanted_mode = dtd.CVTMode;
const wanted_margins = dtd.HorizontalBorder > 0;
const wanted_interlaced = dtd.Interlaced;
function updateDtd(event: Event) {
  console.log(event);
  // If you are in non cvt mode you can update dtd directly
  // If you are in other mode, you must calculate
  if (wanted_mode === CVTMode.NONCVT) {
    console.log(wanted_hori_active);
    dtd.HorizontalActive = wanted_hori_active;
    dtd.VerticalActive = wanted_vert_active;
  }
  dtd.ComputeTiming(
    wanted_hori_active,
    wanted_vert_active,
    wanted_refresh_rate,
    wanted_mode,
    wanted_margins,
    wanted_interlaced
  );
  console.log(dtd);
}
onload = () => {
  updateDtd();
};
</script>

<template>
  <div class="grid grid-cols-4 gap-2 p-2 m-2">
    <div class="content-center">CVT Mode</div>
    <Select id="CVT Mode" v-model="wanted_mode" @update:modelValue="updateDtd">
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
      <Switch v-model:checked="wanted_interlaced" @update:checked="updateDtd" />
    </div>
  </div>
  <div class="grid grid-cols-2 gap-2 p-2 m-2">
    <NumberField
      id="hor_pix"
      :min="0"
      :step="1"
      v-model="wanted_hori_active"
      @update:modelValue="updateDtd($event)"
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
      :disabled="wanted_mode !== 'non-cvt'"
    >
      <Label id="hor_active">Active Pixels</Label>
      <NumberFieldContent>
        <NumberFieldInput />
      </NumberFieldContent>
    </NumberField>
    <NumberField id="vert_active" v-model="dtd.VerticalActive" :disabled="true">
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
</template>
