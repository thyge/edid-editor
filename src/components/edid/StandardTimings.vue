<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableRow, TableCell } from "@/components/ui/table";
import StandardTiming from "./StandardTiming.vue";
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Standard Timings</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid gap-1 md:grid-cols-1 lg:grid-cols-2">
        <StandardTiming
          v-for="timing in edidstore.mEEDID.EDID.StandardTimings"
          :id="timing.id"
        />
      </div>
    </CardContent>
  </Card>
</template>
