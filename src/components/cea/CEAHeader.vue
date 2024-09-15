<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const header = edidstore.mEEDID.CEA.Header;
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardContent, CardHeader } from "@/components/ui/card";
</script>

<template>
  <CardHeader>
    CEA Header
  </CardHeader>
<CardContent>
  <Table>
    <TableBody>
      <TableRow>
        <TableCell> Version </TableCell>
        <TableCell>
          <Select v-model="header.Version">
            <SelectTrigger>
              <SelectValue></SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="1">1</SelectItem>
              <SelectItem :value="2">2</SelectItem>
              <SelectItem :value="3">3</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell> dtdStartByte </TableCell>
        <TableCell>{{ header.dtdStartByte }}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell> Underscan </TableCell>
        <TableCell>{{ header.Underscan }}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell> YCBCR444 </TableCell>
        <TableCell>{{ header.YCBCR444 }}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell> YCBCR422 </TableCell>
        <TableCell>{{ header.YCBCR422 }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</CardContent>
</template>
