<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div>Chromaticity</div>
  </div>
  <div class="grid grid-cols-4 gap-2 m-4 p-4 border rounded">
    <div class="content-center">RedX</div>
    <div class="content-center">
      <Input v-model="edidstore.mEEDID.EDID.Chromaticity.RedX" disabled />
    </div>
    <div class="content-center">RedY</div>
    <div class="content-center">
      <Input v-model="edidstore.mEEDID.EDID.Chromaticity.RedY" disabled />
    </div>
    <!-- Green -->
    <div class="content-center">GreenX</div>
    <div class="content-center">
      <Input v-model="edidstore.mEEDID.EDID.Chromaticity.GreenX" disabled />
    </div>
    <div class="content-center">GreenY</div>
    <div class="content-center">
      <Input v-model="edidstore.mEEDID.EDID.Chromaticity.GreenY" disabled />
    </div>
    <!-- Blue -->
    <div class="content-center">BlueX</div>
    <div class="content-center">
      <Input v-model="edidstore.mEEDID.EDID.Chromaticity.BlueX" disabled />
    </div>
    <div class="content-center">BlueY</div>
    <div class="content-center">
      <Input v-model="edidstore.mEEDID.EDID.Chromaticity.BlueY" disabled />
    </div>
    <div class="content-center">WhiteX</div>
    <div class="content-center">
      <Input v-model="edidstore.mEEDID.EDID.Chromaticity.WhiteX" disabled />
    </div>
    <div class="content-center">WhiteY</div>
    <div class="content-center">
      <Input v-model="edidstore.mEEDID.EDID.Chromaticity.WhiteY" disabled />
    </div>
  </div>
</template>
