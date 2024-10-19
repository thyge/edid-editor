<script setup lang="ts">
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
const prop = defineProps<{
  block: any;
  id: number;
}>();
const dtd = prop.block;
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Input from "./ui/input/Input.vue";
import Switch from "./ui/switch/Switch.vue";
import { SyncType } from "../edidjs/DetailedTimingDescriptor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import CVTCalculator from "./CVTCalculator.vue";
</script>

<template>
  <div class="content-center">
    {{ dtd.HorizontalActive }} x {{ dtd.VerticalActive }}@{{
      dtd.VerticalRefreshRate.toFixed(2)
    }}p - {{ (dtd.PixelClockKHz / 1000000).toFixed(2) }} MHz
  </div>

  <Dialog>
    <DialogTrigger> <Button>Edit Timing</Button> </DialogTrigger>
    <DialogContent
      class="sm:max-w-[600px] grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90dvh]"
    >
      <CVTCalculator :block="dtd" />
    </DialogContent>
  </Dialog>
</template>
