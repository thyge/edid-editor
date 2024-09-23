<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
import { Switch } from "@/components/ui/switch";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
const edidstore = useEdidStore();
const prop = defineProps<{
  blockNum: any;
}>();
const block = edidstore.mEEDID.CEA.DataBlocks[prop.blockNum];
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div class="content-center">{{ block.Header.Name }}</div>
  </div>
  <div class="grid grid-cols-3 gap-2 m-4 p-4 border rounded">
    <div class="content-center">Channels</div>
    <div class="content-center">
      <NumberField
        v-model="block.Channels"
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
    <div class="content-center">192 Khz</div>
    <div class="content-center">
      <Switch v-model:checked="block.Sampling192" />
    </div>
    <div></div>
    <div class="content-center">176 Khz</div>
    <div class="content-center">
      <Switch v-model:checked="block.Sampling176" />
    </div>
    <div></div>
    <div class="content-center">96 Khz</div>
    <div class="content-center">
      <Switch v-model:checked="block.Sampling96" />
    </div>
    <div></div>
    <div class="content-center">88 Khz</div>
    <div class="content-center">
      <Switch v-model:checked="block.Sampling88" />
    </div>
    <div></div>
    <div class="content-center">48 Khz</div>
    <div class="content-center">
      <Switch v-model:checked="block.Sampling48" />
    </div>
    <div></div>
    <div class="content-center">44.1  Khz</div>
    <div class="content-center">
      <Switch v-model:checked="block.Sampling44_1" />
    </div>
    <div></div>
    <div class="content-center">32 Khz</div>
    <div class="content-center">
      <Switch v-model:checked="block.Sampling32" />
    </div>
    <div></div>
    <div class="content-center">BitDepth16</div>
    <div class="content-center">
      <Switch v-model:checked="block.BitDepth16" />
    </div>
    <div></div>
    <div class="content-center">BitDepth20</div>
    <div class="content-center">
      <Switch v-model:checked="block.BitDepth20" />
    </div>
    <div></div>
    <div class="content-center">BitDepth24</div>
    <div class="content-center">
      <Switch v-model:checked="block.BitDepth24" />
    </div>
  </div>
</template>
