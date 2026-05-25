<script setup lang="ts">
import { HDMI_2_0 } from "@/edidts";
import { Switch } from "@/components/ui/switch";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
const prop = defineProps<{
  block: HDMI_2_0;
}>();
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div class="content-center">{{ block.Header.Name }}</div>
  </div>
  <div class="grid grid-cols-3 gap-2 m-4 p-4 border rounded">
    <div class="content-center">Max_TMDS_Clock</div>
    <div class="content-center">
      <NumberField
        v-model="block.Max_TMDS_Frequency"
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
    <div class="content-center">SCDC_Present</div>
    <div class="content-center">
      <Switch v-model:checked="block.SCDC_Present" />
    </div>
    <div></div>
    <div class="content-center">RR_Capable</div>
    <div class="content-center">
      <Switch v-model:checked="block.RR_Capable" />
    </div>
    <div></div>
    <div class="content-center">CCBPCI</div>
    <div class="content-center">
      <Switch v-model:checked="block.CCBPCI" />
    </div>
    <div></div>
    <div class="content-center">LTE_340Mcsc_scramble</div>
    <div class="content-center">
      <Switch
        v-model:checked="block.LTE_340Mcsc_scramble"
      />
    </div>
    <div></div>
    <div class="content-center">Independent_View</div>
    <div class="content-center">
      <Switch
        v-model:checked="block.Independent_View"
      />
    </div>
    <div></div>
    <div class="content-center">Dual_View</div>
    <div class="content-center">
      <Switch v-model:checked="block.Dual_View" />
    </div>
    <div></div>
    <div class="content-center">OSD_3D_Disparity</div>
    <div class="content-center">
      <Switch
        v-model:checked="block.OSD_3D_Disparity"
      />
    </div>
    <div></div>
    <div class="content-center">DC_Y420_48bit</div>
    <div class="content-center">
      <Switch v-model:checked="block.DC_Y420_48bit" />
    </div>
    <div></div>
    <div class="content-center">DC_Y420_36bit</div>
    <div class="content-center">
      <Switch v-model:checked="block.DC_Y420_36bit" />
    </div>
    <div></div>
    <div class="content-center">DC_Y420_30bit</div>
    <div class="content-center">
      <Switch v-model:checked="block.DC_Y420_30bit" />
    </div>
    <div></div>
    <div class="content-center">MaxFixedRateLink</div>
    <div class="content-center">
      {{ block.MaxFixedRateLink }}
    </div>
  </div>
</template>
