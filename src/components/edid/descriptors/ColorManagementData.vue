<script setup lang="ts">
const prop = defineProps<{
  block: any;
}>();
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { Label } from "@/components/ui/label";
</script>

<template>
  <div class="grid grid-cols-2 p-2 m-4 gap-2">
    <NumberField v-model="prop.block.Red_a3" id="red_a3" :min="0" :max="65535">
      <Label id="red_a3">Red a3</Label>
      <NumberFieldContent>
        <NumberFieldIncrement />
        <NumberFieldInput />
        <NumberFieldDecrement />
      </NumberFieldContent>
    </NumberField>
    <NumberField v-model="prop.block.Red_a2" id="red_a2" :min="0" :max="65535">
      <Label id="red_a2">Red a2</Label>
      <NumberFieldContent>
        <NumberFieldIncrement />
        <NumberFieldInput />
        <NumberFieldDecrement />
      </NumberFieldContent>
    </NumberField>
    <NumberField v-model="prop.block.Green_a3" id="Green_a3" :min="0" :max="65535">
      <Label id="Green_a3">Green a3</Label>
      <NumberFieldContent>
        <NumberFieldIncrement />
        <NumberFieldInput />
        <NumberFieldDecrement />
      </NumberFieldContent>
    </NumberField>
    <NumberField v-model="prop.block.Green_a2" id="Green_a2" :min="0" :max="65535">
      <Label id="Green_a2">Green a2</Label>
      <NumberFieldContent>
        <NumberFieldIncrement />
        <NumberFieldInput />
        <NumberFieldDecrement />
      </NumberFieldContent>
    </NumberField>
    <NumberField v-model="prop.block.Blue_a3" id="Blue_a3" :min="0" :max="65535">
      <Label id="Blue_a3">Blue a3</Label>
      <NumberFieldContent>
        <NumberFieldIncrement />
        <NumberFieldInput />
        <NumberFieldDecrement />
      </NumberFieldContent>
    </NumberField>
    <NumberField v-model="prop.block.Blue_a2" id="Blue_a2" :min="0" :max="65535">
      <Label id="Blue_a2">Blue a2</Label>
      <NumberFieldContent>
        <NumberFieldIncrement />
        <NumberFieldInput />
        <NumberFieldDecrement />
      </NumberFieldContent>
    </NumberField>
  </div>
</template>
