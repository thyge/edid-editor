<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const medid = edidstore.mEEDID.EDID;
const prop = defineProps<{
  num: number;
}>();
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
</script>

<template>
  <Table
    v-if="
      medid.DisplayDescriptors[prop.num - 1].Type === 'Display Product Name'
    "
  >
    <TableBody>
      <TableRow>
        <TableCell>{{ medid.DisplayDescriptors[prop.num - 1].Type }}</TableCell>
        <TableCell>
          <Input v-model="medid.DisplayDescriptors[prop.num - 1].Content" />
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
