<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
const prop = defineProps<{
  blockNum: any;
}>();
const block = edidstore.mEEDID.CEA.DataBlocks[prop.blockNum];
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>
        Video Data Block
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
      <TableHeader>
        <TableCell>Name</TableCell>
        <TableCell>VIC</TableCell>
        <TableCell>PixelClock</TableCell>
        <TableCell>Description</TableCell>
      </TableHeader>
    <TableBody>
      <TableRow v-for="vic in block.Content.VICs" >
        <TableCell>{{ vic.Name }}</TableCell>
        <TableCell>{{ vic.VIC }}</TableCell>
        <TableCell>{{ vic.PixelMHz }} MHz</TableCell>
        <TableCell>{{ vic.Description }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
    </CardContent>
  </Card>
  
</template>
