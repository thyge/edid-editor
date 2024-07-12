<script setup lang="ts">
import { ref } from "vue";
import { watch } from 'vue';
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
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
const locRevision = ref(edidstore.mEEDID.EDID.Revision);
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>EDID Header</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell> Extensions </TableCell>
            <TableCell> {{ edidstore.mEEDID.Extensions }} </TableCell>
          </TableRow>
          <TableRow>
            <TableCell> Manufacturer ID </TableCell>
            <TableCell> {{ edidstore.mEEDID.EDID.ManufacturerID }} </TableCell>
            <TableCell>
              {{ edidstore.mEEDID.EDID.GetPNPCompanyName() }}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell> Serial Number </TableCell>
            <TableCell> {{ edidstore.mEEDID.EDID.SerialNumber }} </TableCell>
          </TableRow>
          <TableRow>
            <TableCell> Product Name </TableCell>
            <TableCell> {{ edidstore.getDisplayProductName }} </TableCell>
          </TableRow>
          <TableRow>
            <TableCell> Date of manufacture </TableCell>
            <TableCell>
              <Label>Year</Label>
              <NumberField
                v-model="edidstore.mEEDID.EDID.YearOfManufacture"
                :min="1990"
                :max="2246"
                @input="edidstore.setHeader"
              >
                <NumberFieldContent>
                  <NumberFieldIncrement @click="edidstore.setHeader"/>
                  <NumberFieldInput />
                  <NumberFieldDecrement @click="edidstore.setHeader"/>
                </NumberFieldContent>
              </NumberField>
            </TableCell>
            <TableCell>
              <Label>Week</Label>
              <NumberField
                v-model="edidstore.mEEDID.EDID.WeekOfManufacture"
                :min="0"
                :max="52"
                @input="edidstore.setHeader"
              >
                <NumberFieldContent>
                  <NumberFieldIncrement @click="edidstore.setHeader"/>
                  <NumberFieldInput />
                  <NumberFieldDecrement @click="edidstore.setHeader"/>
                </NumberFieldContent>
              </NumberField>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell> Version and Revision </TableCell>
            <TableCell>
              <Select v-model.number="edidstore.mEEDID.EDID.Revision" @change="edidstore.setHeader">
                <SelectTrigger>
                  <SelectValue></SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="3">1.3</SelectItem>
                  <SelectItem :value="4">1.4</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</template>
