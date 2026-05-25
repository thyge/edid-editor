<script setup lang="ts">
import { HDMI_1_4 } from "edidts";
import { Switch } from "@/components/ui/switch";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
const prop = defineProps<{
  block: HDMI_1_4;
}>();
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div class="content-center">{{ block.Header.Name }}</div>
  </div>
  <div class="grid grid-cols-3 gap-2 m-4 p-4 border rounded">
    <div class="content-center">Address</div>
    <div class="content-center">
      {{ block.Address.A }} :
      {{ block.Address.B }} :
      {{ block.Address.C }} :
      {{ block.Address.D }}
    </div>
    <div></div>
    <div class="content-center">10 Bits Per Pixel</div>
    <div class="content-center">
      <Switch v-model:checked="block.BitDepth10" />
    </div>
    <div></div>
    <div class="content-center">12 Bits Per Pixel</div>
    <div class="content-center">
      <Switch v-model:checked="block.BitDepth12" />
    </div>
    <div></div>
    <div class="content-center">16 Bits Per Pixel</div>
    <div class="content-center">
      <Switch v-model:checked="block.BitDepth16" />
    </div>
    <div></div>
    <div class="content-center">DVI Dual Link</div>
    <div class="content-center">
      <Switch v-model:checked="block.DVIDualLinkOperation" />
    </div>
    <div></div>
    <div class="content-center">DeepColour444</div>
    <div class="content-center">
      <Switch v-model:checked="block.DeepColour444" />
    </div>
    <div></div>
    <div class="content-center">Max_TMDS_Clock</div>
    <div class="content-center">
      <NumberField
        v-model="block.Max_TMDS_Clock"
        :disabled="true"
      >
        <NumberFieldContent>
          <NumberFieldIncrement />
          <NumberFieldInput />
          <NumberFieldDecrement />
        </NumberFieldContent>
      </NumberField>
    </div>
    <div></div>
  </div>
</template>
