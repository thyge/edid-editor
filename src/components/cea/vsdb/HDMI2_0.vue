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
    <div class="content-center">{{ blocks[prop.blockNum].Header.Name }}</div>
  </div>
  <div class="grid grid-cols-3 gap-2 m-4 p-4 border rounded">
    <div class="content-center">Max_TMDS_Clock</div>
    <div class="content-center">
      <NumberField
        v-model="blocks[prop.blockNum].Max_TMDS_Frequency"
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
      <Switch v-model:checked="blocks[prop.blockNum].SCDC_Present" />
    </div>
    <div></div>
    <div class="content-center">RR_Capable</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].RR_Capable" />
    </div>
    <div></div>
    <div class="content-center">CCBPCI</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].CCBPCI" />
    </div>
    <div></div>
    <div class="content-center">LTE_340Mcsc_scramble</div>
    <div class="content-center">
      <Switch
        v-model:checked="blocks[prop.blockNum].LTE_340Mcsc_scramble"
      />
    </div>
    <div></div>
    <div class="content-center">Independent_View</div>
    <div class="content-center">
      <Switch
        v-model:checked="blocks[prop.blockNum].Independent_View"
      />
    </div>
    <div></div>
    <div class="content-center">Dual_View</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].Dual_View" />
    </div>
    <div></div>
    <div class="content-center">OSD_3D_Disparity</div>
    <div class="content-center">
      <Switch
        v-model:checked="blocks[prop.blockNum].OSD_3D_Disparity"
      />
    </div>
    <div></div>
    <div class="content-center">DC_Y420_48bit</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].DC_Y420_48bit" />
    </div>
    <div></div>
    <div class="content-center">DC_Y420_36bit</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].DC_Y420_36bit" />
    </div>
    <div></div>
    <div class="content-center">DC_Y420_30bit</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].DC_Y420_30bit" />
    </div>
    <div></div>
    <div class="content-center">MaxFixedRateLink</div>
    <div class="content-center">
      {{ blocks[prop.blockNum].MaxFixedRateLink }}
    </div>
  </div>
</template>
