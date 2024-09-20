<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const prop = defineProps<{
  blockNum: any;
}>();
const blocks = edidstore.mEEDID.CEA.DataBlocks;
import { Switch } from "@/components/ui/switch";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div class="content-center">HDMI 1.4</div>
  </div>
  <div class="grid grid-cols-3 gap-2 m-4 p-4 border rounded">
    <div class="content-center">Max_TMDS_Clock</div>
    <div class="content-center">
      <NumberField
        v-model="blocks[prop.blockNum].Content.Max_TMDS_Frequency"
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
      <Switch v-model:checked="blocks[prop.blockNum].Content.SCDC_Present" />
    </div>
    <div></div>
    <div class="content-center">RR_Capable</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].Content.RR_Capable" />
    </div>
    <div></div>
    <div class="content-center">CCBPCI</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].Content.CCBPCI" />
    </div>
    <div></div>
    <div class="content-center">LTE_340Mcsc_scramble</div>
    <div class="content-center">
      <Switch
        v-model:checked="blocks[prop.blockNum].Content.LTE_340Mcsc_scramble"
      />
    </div>
    <div></div>
    <div class="content-center">Independent_View</div>
    <div class="content-center">
      <Switch
        v-model:checked="blocks[prop.blockNum].Content.Independent_View"
      />
    </div>
    <div></div>
    <div class="content-center">Dual_View</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].Content.Dual_View" />
    </div>
    <div></div>
    <div class="content-center">OSD_3D_Disparity</div>
    <div class="content-center">
      <Switch
        v-model:checked="blocks[prop.blockNum].Content.OSD_3D_Disparity"
      />
    </div>
    <div></div>
    <div class="content-center">DC_Y420_48bit</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].Content.DC_Y420_48bit" />
    </div>
    <div></div>
    <div class="content-center">DC_Y420_36bit</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].Content.DC_Y420_36bit" />
    </div>
    <div></div>
    <div class="content-center">DC_Y420_30bit</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].Content.DC_Y420_30bit" />
    </div>
    <div></div>
    <div class="content-center">MaxFixedRateLink</div>
    <div class="content-center">
      {{ blocks[prop.blockNum].Content.MaxFixedRateLink }}
    </div>
  </div>
</template>
