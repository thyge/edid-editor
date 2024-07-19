<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const videoInDef = edidstore.mEEDID.EDID.VideoInputDefinition
import VideoInputDefinitionFeatureSupport from "./VideoInputDefinitionFeatureSupport.vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
console.log(videoInDef)
</script>

<!--
Video Input Definition
Horizontal Screen Size or Aspect Ratio
Landscape / Portrait
Display Transfer Characteristic (Gamma)
Feature Support 
-->

<template>
  <Card>
    <CardHeader>
      <CardTitle>Display Parameters</CardTitle>
    </CardHeader>
    <CardContent>
      <Card>
        <CardHeader>
          <CardTitle class="text-sm">Video Input Definition</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell> Display Interface </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            </TableBody>
            <TableBody
              v-if="videoInDef.VideoSignalInterface === 'Digital'"
            >
              <TableRow>
                <TableCell> Display Bitdepth </TableCell>
                <TableCell>
                  <Select v-model="videoInDef.BitDepth">
                    <SelectTrigger
                      :disabled="edidstore.mEEDID.EDID.Revision < 4"
                    >
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
                    <SelectTrigger
                      :disabled="edidstore.mEEDID.EDID.Revision < 4"
                    >
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
            <TableBody
              v-else-if="edidstore.mEEDID.EDID.DisplayInterface === 'Analog'"
            >
              <TableRow>
                <TableCell> Analog not supported </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle class="text-sm">Screen</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell> Display Size </TableCell>
                <TableCell>
                  {{ edidstore.mEEDID.EDID.HorizontalSizeCM }}cm x
                  {{ edidstore.mEEDID.EDID.VerticalSizeCM }}cm
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell> Display Gamma </TableCell>
                <TableCell> {{ edidstore.mEEDID.EDID.Gamma }} </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle class="text-sm">Feature Support</CardTitle>
        </CardHeader>
        <CardContent>
          <VideoInputDefinitionFeatureSupport />
        </CardContent>
      </Card>
    </CardContent>
  </Card>
</template>
