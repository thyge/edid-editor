<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
const prop = defineProps<{
  id: number;
}>();
</script>

<template>
  <div>
    <div class="grid grid-cols-3 gap-2 m-4">
      <div>Timing {{ prop.id }}</div>
    </div>
    <div class="grid grid-cols-2 gap-2 p-4 m-4 border rounded">
      <div class="content-center">Enabled</div>
      <div class="content-center">
        <Switch
          v-model:checked="
            edidstore.mEEDID.EDID.StandardTimings[prop.id].Enabled
          "
          @update:checked="edidstore.updateEdid()"
        />
      </div>
      <div class="content-center">Horizontal Active Pixels</div>
      <div class="content-center">
        <NumberField
          v-model="
            edidstore.mEEDID.EDID.StandardTimings[prop.id].HorizontalActive
          "
          :default-value="256"
          :min="256"
          :max="2288"
          :disabled="!edidstore.mEEDID.EDID.StandardTimings[prop.id].Enabled"
          @update:modelValue="edidstore.updateEdid()"
        >
          <NumberFieldContent>
            <NumberFieldIncrement />
            <NumberFieldInput />
            <NumberFieldDecrement />
          </NumberFieldContent>
        </NumberField>
      </div>
      <div class="content-center">RefreshRate</div>
      <div class="content-center">
        <NumberField
          v-model="edidstore.mEEDID.EDID.StandardTimings[prop.id].RefreshRate"
          :default-value="60"
          :min="60"
          :max="123"
          :disabled="!edidstore.mEEDID.EDID.StandardTimings[prop.id].Enabled"
          @update:modelValue="edidstore.updateEdid()"
        >
          <NumberFieldContent>
            <NumberFieldIncrement />
            <NumberFieldInput />
            <NumberFieldDecrement />
          </NumberFieldContent>
        </NumberField>
      </div>
      <div class="content-center">Aspect Ratio</div>
      <div class="content-center">
        <RadioGroup
          v-model="edidstore.mEEDID.EDID.StandardTimings[prop.id].AspectRatio"
          :disabled="
            edidstore.mEEDID.EDID.StandardTimings[prop.id].Enabled === false
          "
          @update:modelValue="edidstore.updateEdid()"
        >
          <div class="flex items-center space-x-2">
            <RadioGroupItem id="r1" value="16:10" />
            <Label for="r1">16:10</Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem id="r2" value="4:3" />
            <Label for="r2">4:3</Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem id="r3" value="5:4" />
            <Label for="r3">5:4</Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem id="r4" value="16:9" />
            <Label for="r4">16:9</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  </div>
</template>
