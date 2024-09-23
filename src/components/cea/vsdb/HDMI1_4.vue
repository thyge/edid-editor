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
    <div class="content-center">Address</div>
    <div class="content-center">
      {{ blocks[prop.blockNum].Address.A }} :
      {{ blocks[prop.blockNum].Address.B }} :
      {{ blocks[prop.blockNum].Address.C }} :
      {{ blocks[prop.blockNum].Address.D }}
    </div>
    <div></div>
    <div class="content-center">10 Bits Per Pixel</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].BitDepth10" />
    </div>
    <div></div>
    <div class="content-center">12 Bits Per Pixel</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].BitDepth12" />
    </div>
    <div></div>
    <div class="content-center">16 Bits Per Pixel</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].BitDepth16" />
    </div>
    <div></div>
    <div class="content-center">DVI Dual Link</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].DVIDualLinkOperation" />
    </div>
    <div></div>
    <div class="content-center">DeepColour444</div>
    <div class="content-center">
      <Switch v-model:checked="blocks[prop.blockNum].DeepColour444" />
    </div>
    <div></div>
    <div class="content-center">Max_TMDS_Clock</div>
    <div class="content-center">
      <NumberField
        v-model="blocks[prop.blockNum].Max_TMDS_Clock"
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
