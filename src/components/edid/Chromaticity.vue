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
    <div>RedX</div>
    <div>
      <Input v-model="edidstore.mEEDID.EDID.Chromaticity.RedX" disabled />
    </div>
    <div>RedY</div>
    <div>
      <Input v-model="edidstore.mEEDID.EDID.Chromaticity.RedY" disabled />
    </div>
    <!-- Green -->
    <div>GreenX</div>
    <div>
      <Input v-model="edidstore.mEEDID.EDID.Chromaticity.GreenX" disabled />
    </div>
    <div>GreenY</div>
    <div>
      <Input v-model="edidstore.mEEDID.EDID.Chromaticity.GreenY" disabled />
    </div>
    <!-- Blue -->
    <div>BlueX</div>
    <div>
      <Input v-model="edidstore.mEEDID.EDID.Chromaticity.BlueX" disabled />
    </div>
    <div>BlueY</div>
    <div>
      <Input v-model="edidstore.mEEDID.EDID.Chromaticity.BlueY" disabled />
    </div>
    <div>WhiteX</div>
    <div>
      <Input v-model="edidstore.mEEDID.EDID.Chromaticity.WhiteX" disabled />
    </div>
    <div>WhiteY</div>
    <div>
      <Input v-model="edidstore.mEEDID.EDID.Chromaticity.WhiteY" disabled />
    </div>
  </div>
</template>
