<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
</script>

<template>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell> RedX </TableCell>
            <TableCell>{{ edidstore.mEEDID.EDID.Chromaticity.RedX }}</TableCell>
            <TableCell> RedY </TableCell>
            <TableCell>{{ edidstore.mEEDID.EDID.Chromaticity.RedY }}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell> GreenX </TableCell>
            <TableCell>{{ edidstore.mEEDID.EDID.Chromaticity.GreenX }}</TableCell>
            <TableCell> GreenY </TableCell>
            <TableCell>{{ edidstore.mEEDID.EDID.Chromaticity.GreenY }}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell> BlueX </TableCell>
            <TableCell>{{ edidstore.mEEDID.EDID.Chromaticity.BlueX }}</TableCell>
            <TableCell> BlueY </TableCell>
            <TableCell>{{ edidstore.mEEDID.EDID.Chromaticity.BlueY }}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell> WhiteX </TableCell>
            <TableCell>{{ edidstore.mEEDID.EDID.Chromaticity.WhiteX }}</TableCell>
            <TableCell> WhiteY </TableCell>
            <TableCell>{{ edidstore.mEEDID.EDID.Chromaticity.WhiteY }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
</template>
