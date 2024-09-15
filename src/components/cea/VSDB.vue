<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
const prop = defineProps<{
  blockNum: any;
}>();
const blocks = edidstore.mEEDID.CEA.DataBlocks;
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
</script>

<template>
    <CardHeader>
        {{ blocks[prop.blockNum].Content.ExtendedName }} - VSDB
    </CardHeader>
    <CardContent>
      <Table v-if="blocks[prop.blockNum].Content.ExtendedName === 'HDMI 1.4'">
        <TableBody>
          <TableRow>
            <TableCell>10 Bits Per Pixel</TableCell>
            <TableCell>
              <Switch
                v-model:checked="blocks[prop.blockNum].Content.BitDepth10"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>12 Bits Per Pixel</TableCell>
            <TableCell>
              <Switch
                v-model:checked="blocks[prop.blockNum].Content.BitDepth12"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>16 Bits Per Pixel</TableCell>
            <TableCell>
              <Switch
                v-model:checked="blocks[prop.blockNum].Content.BitDepth16"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>DVI Dual Link</TableCell>
            <TableCell>
              <Switch
                v-model:checked="
                  blocks[prop.blockNum].Content.DVIDualLinkOperation
                "
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>DeepColour444</TableCell>
            <TableCell>
              <Switch
                v-model:checked="blocks[prop.blockNum].Content.DeepColour444"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Max_TMDS_Clock</TableCell>
            <TableCell>
              <NumberField
                v-model="blocks[prop.blockNum].Content.Max_TMDS_Clock"
                :disabled="true"
              >
                <NumberFieldContent>
                  <NumberFieldIncrement />
                  <NumberFieldInput />
                  <NumberFieldDecrement />
                </NumberFieldContent>
              </NumberField>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Table
        v-else-if="blocks[prop.blockNum].Content.ExtendedName === 'HDMI 2.0'"
      >
        <TableBody>
          <TableRow>
            <TableCell>Max_TMDS_Clock</TableCell>
            <TableCell>
              <NumberField
                v-model="blocks[prop.blockNum].Content.Max_TMDS_Frequency"
                :disabled="true"
              >
                <NumberFieldContent>
                  <NumberFieldIncrement />
                  <NumberFieldInput />
                  <NumberFieldDecrement />
                </NumberFieldContent>
              </NumberField>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>SCDC_Present</TableCell>
            <TableCell>
              <Switch
                v-model:checked="blocks[prop.blockNum].Content.SCDC_Present"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>RR_Capable</TableCell>
            <TableCell>
              <Switch
                v-model:checked="blocks[prop.blockNum].Content.RR_Capable"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>CCBPCI</TableCell>
            <TableCell>
              <Switch v-model:checked="blocks[prop.blockNum].Content.CCBPCI" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>LTE_340Mcsc_scramble</TableCell>
            <TableCell>
              <Switch
                v-model:checked="
                  blocks[prop.blockNum].Content.LTE_340Mcsc_scramble
                "
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Independent_View</TableCell>
            <TableCell>
              <Switch
                v-model:checked="blocks[prop.blockNum].Content.Independent_View"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Dual_View</TableCell>
            <TableCell>
              <Switch
                v-model:checked="blocks[prop.blockNum].Content.Dual_View"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>OSD_3D_Disparity</TableCell>
            <TableCell>
              <Switch
                v-model:checked="blocks[prop.blockNum].Content.OSD_3D_Disparity"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>DC_Y420_48bit</TableCell>
            <TableCell>
              <Switch
                v-model:checked="blocks[prop.blockNum].Content.DC_Y420_48bit"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>DC_Y420_36bit</TableCell>
            <TableCell>
              <Switch
                v-model:checked="blocks[prop.blockNum].Content.DC_Y420_36bit"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>DC_Y420_30bit</TableCell>
            <TableCell>
              <Switch
                v-model:checked="blocks[prop.blockNum].Content.DC_Y420_30bit"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>MaxFixedRateLink</TableCell>
            <TableCell>
              {{ blocks[prop.blockNum].Content.MaxFixedRateLink }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
</template>
