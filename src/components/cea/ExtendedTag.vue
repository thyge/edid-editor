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
</script>

<template>
   <Card>
    <CardHeader>
      <CardTitle>
        {{ blocks[prop.blockNum].Content.ExtendedName }} - Ext
      </CardTitle>
    </CardHeader>
    <CardContent>
      
    </CardContent>
  </Card>
  
</template>
