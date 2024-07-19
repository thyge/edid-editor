<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { watch } from "vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { takeCoverage } from "v8";
const videoInDef = edidstore.mEEDID.EDID.VideoInputDefinition;
watch(
  () => edidstore.mEEDID.EDID.VideoInputDefinition.VideoSignalInterface,
  () => {
    edidstore.setHeader();
  }
);
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-sm">Video Input Definition</CardTitle>
    </CardHeader>
    <CardContent>
      <Label id="digital-mode">Video Signal Interface</Label>
      <Select
        id="digital-mode"
        v-model="videoInDef.VideoSignalInterface"
        @change="edidstore.setHeader"
      >
        <SelectTrigger>
          <SelectValue></SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Analog">Analog</SelectItem>
          <SelectItem value="Digital">Digital</SelectItem>
        </SelectContent>
      </Select>
      <Table v-if="videoInDef.VideoSignalInterface === 'Digital'">
        <TableBody>
          <TableRow>
            <TableCell> Display Bitdepth </TableCell>
            <TableCell>
              <Select v-model="videoInDef.BitDepth">
                <SelectTrigger :disabled="edidstore.mEEDID.EDID.Revision < 4">
                  <SelectValue></SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undefined">undefined</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="16">16</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell> EDID 1.4 Only </TableCell>
          </TableRow>
          <TableRow>
            <TableCell> Display Interface </TableCell>
            <TableCell>
              <Select v-model="edidstore.mEEDID.EDID.VideoInterface">
                <SelectTrigger :disabled="edidstore.mEEDID.EDID.Revision < 4">
                  <SelectValue></SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undefined">undefined</SelectItem>
                  <SelectItem value="DVI">DVI</SelectItem>
                  <SelectItem value="HDMIa">HDMIa</SelectItem>
                  <SelectItem value="HDMIb">HDMIb</SelectItem>
                  <SelectItem value="MDDI">MDDI</SelectItem>
                  <SelectItem value="DisplayPort">DisplayPort</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell> EDID 1.4 Only </TableCell>
          </TableRow>
          <TableRow>
            <TableCell> RGB 4:4:4 + YCrCb 4:4:4 </TableCell>
            <TableCell>
              <Switch
                :disabled="edidstore.mEEDID.EDID.Revision < 4"
                v-model="edidstore.mEEDID.EDID.ColourEncoding.YUV444"
              />
            </TableCell>
            <TableCell> EDID 1.4 Only </TableCell>
          </TableRow>
          <TableRow>
            <TableCell> RGB 4:4:4 + YCrCb 4:2:2 </TableCell>
            <TableCell>
              <Switch
                :disabled="edidstore.mEEDID.EDID.Revision < 4"
                v-model="edidstore.mEEDID.EDID.ColourEncoding.YUV422"
              />
            </TableCell>
            <TableCell> EDID 1.4 Only </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Table v-else-if="videoInDef.VideoSignalInterface === 'Analog'">
        <TableBody>
          <TableRow>
            <TableCell> Analog not supported </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</template>
