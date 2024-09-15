<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import VideoInputDefinitionFeatureSupport from "./VideoInputDefinitionFeatureSupport.vue";
import VideoInputDefinition from "./VideoInputDefinition.vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
</script>

<template>
  <VideoInputDefinition />
  <!-- <Card>
    <CardHeader>
      <CardTitle class="text-sm">Screen</CardTitle>
    </CardHeader>
    <CardContent> -->
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
    <!-- </CardContent>
  </Card> -->
  <!-- <Card>
    <CardHeader>
      <CardTitle class="text-sm">Feature Support</CardTitle>
    </CardHeader>
    <CardContent> -->
      <VideoInputDefinitionFeatureSupport />
    <!-- </CardContent>
  </Card> -->
</template>
