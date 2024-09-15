<script setup lang="ts">
import { watch } from "vue";
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
import { Input } from "@/components/ui/input";
// Hack working around @change not working for Select
watch(
  () => edidstore.mEEDID.EDID.Revision,
  () => {
    edidstore.setHeader();
  }
);
</script>

<template>
  <CardHeader>
    EDID Header
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
          <TableCell
            ><Input
              v-model="edidstore.mEEDID.EDID.ManufacturerID"
              type="text"
              maxlength="3"
              @input="edidstore.setHeader"
            />
          </TableCell>
          <TableCell>
            {{ edidstore.mEEDID.EDID.GetPNPCompanyName() }}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell> Serial Number </TableCell>
          <TableCell>
            <Input
              v-model="edidstore.mEEDID.EDID.SerialNumber"
              type="number"
              max="4294967295"
              min="0"
              @input="edidstore.setHeader"
          /></TableCell>
        </TableRow>
        <TableRow>
          <TableCell> Product Name </TableCell>
          <TableCell> {{ edidstore.getDisplayProductName }} </TableCell>
        </TableRow>
        <TableRow>
          <TableCell> Date of manufacture </TableCell>
          <TableCell>
            <Label>
              Year
              <NumberField
                v-model="edidstore.mEEDID.EDID.YearOfManufacture"
                :min="1990"
                :max="2246"
                @input="edidstore.setHeader"
                id="yearofmanu"
              >
                <NumberFieldContent>
                  <NumberFieldIncrement @click="edidstore.setHeader" />
                  <NumberFieldInput />
                  <NumberFieldDecrement @click="edidstore.setHeader" />
                </NumberFieldContent>
              </NumberField>
            </Label>
          </TableCell>
          <TableCell>
            <Label id="weekofmanu">
              Week
              <NumberField
                v-model="edidstore.mEEDID.EDID.WeekOfManufacture"
                :min="0"
                :max="52"
                @input="edidstore.setHeader"
                id="weekofmanu"
              >
                <NumberFieldContent>
                  <NumberFieldIncrement @click="edidstore.setHeader" />
                  <NumberFieldInput />
                  <NumberFieldDecrement @click="edidstore.setHeader" />
                </NumberFieldContent>
              </NumberField>
            </Label>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell> Version and Revision </TableCell>
          <TableCell>
            <Select
              v-model="edidstore.mEEDID.EDID.Revision"
              @change="onChange($event)"
              id="selectRevision"
            >
              <SelectTrigger>
                <SelectValue></SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">1.3</SelectItem>
                <SelectItem value="4">1.4</SelectItem>
              </SelectContent>
            </Select>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </CardContent>
</template>
