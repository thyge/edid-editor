<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { Table, TableRow, TableCell, TableBody } from "@/components/ui/table";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
const prop = defineProps<{
  id: number;
}>();
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-sm font-medium"
        >Timing {{ prop.id }}</CardTitle
      >
    </CardHeader>
    <CardContent>
      <Table class="text-xs">
        <TableBody>
          <TableRow>
            <TableCell>Enabled</TableCell>
            <TableCell>
              <Switch v-model:checked="edidstore.mEEDID.EDID.StandardTimings[prop.id - 1].Enabled"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Horizontal Active Pixels</TableCell>
            <NumberField
              v-model="
                edidstore.mEEDID.EDID.StandardTimings[prop.id - 1]
                  .HorizontalActive
              "
              :default-value="256"
              :min="256"
              :max="2288"
              :disabled="!edidstore.mEEDID.EDID.StandardTimings[prop.id - 1].Enabled"
            >
              <NumberFieldContent>
                <NumberFieldIncrement />
                <NumberFieldInput />
                <NumberFieldDecrement />
              </NumberFieldContent>
            </NumberField>
          </TableRow>
          <TableRow>
            <TableCell>RefreshRate</TableCell>
            <NumberField
              v-model="
                edidstore.mEEDID.EDID.StandardTimings[prop.id - 1]
                  .RefreshRate
              "
              :default-value="60"
              :min="60"
              :max="123"
              :disabled="!edidstore.mEEDID.EDID.StandardTimings[prop.id - 1].Enabled"
            >
              <NumberFieldContent>
                <NumberFieldIncrement />
                <NumberFieldInput />
                <NumberFieldDecrement />
              </NumberFieldContent>
            </NumberField>
          </TableRow>
          <TableRow>
            <TableCell>Aspect Ratio</TableCell>
            <RadioGroup
              v-model="
                edidstore.mEEDID.EDID.StandardTimings[prop.id - 1]
                  .AspectRatio
              "
              :disabled="edidstore.mEEDID.EDID.StandardTimings[prop.id - 1].Enabled === false"
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
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</template>
