<script setup lang="ts">
const prop = defineProps<{
  block: any;
  id: number;
}>();
import { useEdidStore } from "@/stores/edidStore";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
const edidstore = useEdidStore();
</script>

<template>
  <div class="grid grid-cols-2">
    <template v-for="wp in prop.block.WhitePoints">
      <div>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>WhitePointIndex</TableCell>
              <TableCell> {{wp.WhitePointIndex}} </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>WhiteX</TableCell>
              <TableCell>{{ wp.WhiteX }}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>WhiteY</TableCell>
              <TableCell>{{ wp.WhiteY }}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>White Gamma</TableCell>
              <TableCell>{{ wp.WhiteGamma }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </template>
    <div>LineFeed: {{ prop.block.LineFeed }}</div>
  </div>
</template>
