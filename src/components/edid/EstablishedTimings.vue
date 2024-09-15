<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
</script>

<template>
  <Table>
    <TableBody>
      <TableRow>
        <TableCell>720 x 400 @ 70Hz</TableCell>
        <TableCell>
          <Switch
            :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET720_400_70"
          />
        </TableCell>
        <TableCell>800 x 600 @ 56Hz</TableCell>
        <TableCell>
          <Switch
            :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET800_600_56"
          />
        </TableCell>
        <TableCell>1024 x 768 @ 60Hz</TableCell>
        <TableCell>
          <Switch
            :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET1024_768_60"
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>720 x 400 @ 88Hz</TableCell>
        <TableCell>
          <Switch
            :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET720_400_88"
          />
        </TableCell>
        <TableCell>800 x 600 @ 60Hz</TableCell>
        <TableCell>
          <Switch
            :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET800_600_60"
          />
        </TableCell>
        <TableCell>1024 x 768 @ 70Hz</TableCell>
        <TableCell>
          <Switch
            :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET1024_768_70"
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>640 x 480 @ 60Hz</TableCell>
        <TableCell>
          <Switch
            :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET640_480_60"
          />
        </TableCell>
        <TableCell>800 x 600 @ 72Hz</TableCell>
        <TableCell>
          <Switch
            :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET800_600_72"
          />
        </TableCell>
        <TableCell>1024 x 768 @ 75Hz</TableCell>
        <TableCell>
          <Switch
            :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET1024_768_75"
          />
        </TableCell>
      </TableRow>
      <TableRow> </TableRow>
      <TableCell>640 x 480 @ 67Hz</TableCell>
      <TableCell>
        <Switch
          :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET640_480_67"
        />
      </TableCell>
      <TableCell>800 x 600 @ 75Hz</TableCell>
      <TableCell>
        <Switch
          :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET800_600_75"
        />
      </TableCell>
      <TableCell>1280 x 1024 @ 75Hz</TableCell>
      <TableCell>
        <Switch
          :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET1280_1024_75"
        />
      </TableCell>
      <TableRow>
        <TableCell>640 x 480 @ 72Hz</TableCell>
        <TableCell>
          <Switch
            :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET640_480_72"
          />
        </TableCell>
        <TableCell>832 x 624 @ 75Hz</TableCell>
        <TableCell>
          <Switch
            :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET832_624_75"
          />
        </TableCell>
        <TableCell>1152 x 870 @ 75Hz</TableCell>
        <TableCell>
          <Switch
            :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET1152_870_75"
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>640 x 480 @ 75Hz</TableCell>
        <TableCell>
          <Switch
            :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET640_480_75"
          />
        </TableCell>
        <TableCell>1024 x 768 @ 87Hz Interlaced</TableCell>
        <TableCell>
          <Switch
            :checked="edidstore.mEEDID.EDID.EstablishedTimings.ET1024_768_87"
          />
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
