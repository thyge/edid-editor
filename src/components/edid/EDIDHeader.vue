<script setup lang="ts">
import { watch } from "vue";
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
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
import { Input } from "@/components/ui/input";
// Hack working around @change not working for Select
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div class="content-center">EDID Header</div>
  </div>
  <div class="grid grid-cols-3 gap-2 m-4 p-4 border rounded">
    <div class="content-center">Extensions</div>
    <div class="content-center">{{ edidstore.mEEDID.Extensions }}</div>
    <div></div>
    <div class="content-center">Manufacturer ID</div>
    <div class="content-center">
      <Input
        v-model="edidstore.mEEDID.EDID.ManufacturerID.ID"
        type="text"
        maxlength="3"
        @input="edidstore.updateEdid"
      />
    </div>
    <div class="content-center">
      {{ edidstore.mEEDID.EDID.ManufacturerID.GetPNPCompanyName() }}
    </div>
    <div class="content-center">Serial Number</div>
    <div class="content-center">
      <Input
        v-model="edidstore.mEEDID.EDID.SerialNumber"
        type="number"
        max="4294967295"
        min="0"
        @input="edidstore.updateEdid"
      />
    </div>
    <div></div>
    <div class="content-center">Product Name</div>
    <div class="content-center">{{ edidstore.getDisplayProductName }}</div>
    <div></div>
    <div class="content-center">Date of manufacture</div>
    <div class="content-center">
      <Label>
        Year
        <NumberField
          v-model="edidstore.mEEDID.EDID.YearOfManufacture"
          :min="1990"
          :max="2246"
          @input="edidstore.updateEdid"
          id="yearofmanu"
        >
          <NumberFieldContent>
            <NumberFieldIncrement @click="edidstore.updateEdid" />
            <NumberFieldInput />
            <NumberFieldDecrement @click="edidstore.updateEdid" />
          </NumberFieldContent>
        </NumberField>
      </Label>
    </div>
    <div class="content-center">
      <Label id="weekofmanu">
        Week
        <NumberField
          v-model="edidstore.mEEDID.EDID.WeekOfManufacture"
          :min="0"
          :max="52"
          @input="edidstore.updateEdid"
          id="weekofmanu"
        >
          <NumberFieldContent>
            <NumberFieldIncrement @click="edidstore.updateEdid" />
            <NumberFieldInput />
            <NumberFieldDecrement @click="edidstore.updateEdid" />
          </NumberFieldContent>
        </NumberField>
      </Label>
    </div>
    <div class="content-center">Version and Revision</div>
    <div class="content-center">
      <Select
        v-model="edidstore.mEEDID.EDID.Revision"
        @update:modelValue="edidstore.updateEdid()"
      >
        <SelectTrigger>
          <SelectValue></SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="3">1.3</SelectItem>
          <SelectItem value="4">1.4</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
