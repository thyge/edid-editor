<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
</script>

<template>
  <Table>
    <TableBody>
      <TableRow>
        <TableCell> DPMS Standby </TableCell>
        <TableCell>
          <Switch
            :disabled="edidstore.mEEDID.EDID.Revision < 4"
            v-model="edidstore.mEEDID.EDID.DPMSstandby"
          />
        </TableCell>
        <TableCell> EDID 1.4 Only </TableCell>
      </TableRow>
      <TableRow>
        <TableCell> DPMS Suspend </TableCell>
        <TableCell>
          <Switch
            :disabled="edidstore.mEEDID.EDID.Revision < 4"
            v-model="edidstore.mEEDID.EDID.DPMSsuspend"
          />
        </TableCell>
        <TableCell> EDID 1.4 Only </TableCell>
      </TableRow>
      <TableRow>
        <TableCell> DPMS ActiveOff </TableCell>
        <TableCell>
          <Switch
            :disabled="edidstore.mEEDID.EDID.Revision < 4"
            v-model="edidstore.mEEDID.EDID.DPMSactiveOff"
          />
        </TableCell>
        <TableCell> EDID 1.4 Only </TableCell>
      </TableRow>
      
      <TableRow>
        <TableCell> Native Pixel Format in Preferred Timing Mode </TableCell>
        <TableCell>
          <Switch
            v-model="edidstore.mEEDID.EDID.PreferredTiming"
          />
        </TableCell>
      </TableRow>
      <TableRow v-show="edidstore.mEEDID.EDID.Revision < 4">
        <TableCell> GTF Support </TableCell>
        <TableCell>
          <Switch
            v-model="edidstore.mEEDID.EDID.GTFSupport"
          />
        </TableCell>
        <TableCell>No encoding support</TableCell>
      </TableRow>
      <TableRow v-show="edidstore.mEEDID.EDID.Revision > 3">
        <TableCell> Continuous Frequency </TableCell>
        <TableCell>
          <Switch
            v-model="edidstore.mEEDID.EDID.ContiniousFrequency"
          />
        </TableCell>
        <TableCell>No encoding support</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
