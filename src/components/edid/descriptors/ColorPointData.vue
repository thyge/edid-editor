<script setup lang="ts">
const prop = defineProps<{
  block: any;
  id: number;
}>();
import { useEdidStore } from "@/stores/edidStore";
import { Label } from "@/components/ui/label";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
const edidstore = useEdidStore();
</script>

<template>
  <div class="grid grid-cols-2">
    <div class="grid grid-cols-1 gap-2 m-2" v-for="(wp, index) in prop.block.WhitePoints">
      <NumberField
        id="wp_index"
        :min="0"
        :step="1"
        v-model="wp.WhitePointIndex"
      >
        <Label id="wp_index">WhitePointIndex</Label>
        <NumberFieldContent>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
      <NumberField
        id="wp_x"
        :min="0"
        :step="1"
        v-model="wp.WhiteX"
      >
        <Label id="wp_x">WhiteX</Label>
        <NumberFieldContent>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
      <NumberField
        id="wp_y"
        :min="0"
        :step="1"
        v-model="wp.WhiteY"
      >
        <Label id="wp_y">WhiteY</Label>
        <NumberFieldContent>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
      <NumberField
        id="gamma"
        :min="1"
        :max="3.54"
        :step="0.1"
        v-model="wp.WhiteGamma"
      >
        <Label id="gamma">Gamma</Label>
        <NumberFieldContent>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
    </div>
    <div class="grid grid-cols-1 gap-2 m-2">
        <NumberField
        id="gamma"
        :min="0"
        :max="255"
        :step="1"
        v-model="prop.block.LineFeed"
        @update:modelValue="edidstore.updateEdid()"
      >
        <Label id="gamma">Line Feed</Label>
        <NumberFieldContent>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
    </div>
  </div>
</template>
