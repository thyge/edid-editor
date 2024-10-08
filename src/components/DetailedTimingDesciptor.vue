<script setup lang="ts">
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
const prop = defineProps<{
  block: any;
  id: number;
}>();
const dtd = prop.block;
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Input from "./ui/input/Input.vue";
import Switch from "./ui/switch/Switch.vue";
</script>

<template>
  <div>
    <div class="grid grid-cols-2 gap-2 p-4 m-4 border rounded">
      <div class="content-center">
        {{ dtd.HorizontalActive }} x {{ dtd.VerticalActive }}@{{
          dtd.VerticalRefreshRate.toFixed(2)
        }}p - {{ (dtd.PixelClockKHz / 1000000).toFixed(2) }}Khz
      </div>
      <Popover>
        <PopoverTrigger> <Button>Edit Timing</Button> </PopoverTrigger>
        <PopoverContent class="w-800">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Pixel Clock</TableCell>
                <TableCell>{{ dtd.PixelClockKHz / 1000000 }}</TableCell>
                <TableCell>Interlaced</TableCell>
                <TableCell>
                  <Switch
                    v-model:checked="dtd.Interlaced"
                    @update:checked="dtd.ComputeTiming()"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Horizontal Active Pixels</TableCell>
                <TableCell>
                  <Input v-model="dtd.HorizontalActive" />
                </TableCell>
                <TableCell>Vertical Active Pixels</TableCell>
                <TableCell>
                  <Input v-model="dtd.VerticalActive" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Horizontal Blanking Pixels</TableCell>
                <TableCell>{{ dtd.HorizontalBlanking }}</TableCell>
                <TableCell>Vertical Blanking Pixels</TableCell>
                <TableCell>{{ dtd.VerticalBlanking }}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Horizontal Front Porch</TableCell>
                <TableCell>{{ dtd.HorizontalFrontPorch }}</TableCell>
                <TableCell>Vertical Front Porch</TableCell>
                <TableCell>{{ dtd.VerticalFrontPorch }}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Horizontal Sync Width</TableCell>
                <TableCell>{{ dtd.HorizontalSyncPulseWidth }}</TableCell>
                <TableCell>Vertical Sync Width</TableCell>
                <TableCell>{{ dtd.VerticalSyncPulseWidth }}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Horizontal Image Size</TableCell>
                <TableCell>{{ dtd.HorizontalImageSize }}</TableCell>
                <TableCell>Vertical Image Size</TableCell>
                <TableCell>{{ dtd.VerticalImageSize }}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Horizontal Border</TableCell>
                <TableCell>{{ dtd.HorizontalBorder }}</TableCell>
                <TableCell>Vertical Border</TableCell>
                <TableCell>{{ dtd.VerticalBorder }}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Horizontal Clock</TableCell>
                <TableCell>{{ dtd.HorizontalRefreshRate }}</TableCell>
                <TableCell>Vertical Clock</TableCell>
                <TableCell>
                  <Input v-model="dtd.VerticalRefreshRate" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Stereo Viewing Support</TableCell>
                <TableCell> {{ dtd.StereoMode }} </TableCell>
                <TableCell>Sync</TableCell>
                <TableCell> {{ dtd.Sync }} </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Horizontal Sync Polarity</TableCell>
                <TableCell> {{ dtd.HorizontalSyncPolarity }} </TableCell>
                <TableCell>Vertical Sync Polarity</TableCell>
                <TableCell> {{ dtd.VerticalSyncPolarity }} </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Sync</TableCell>
                <TableCell> {{ dtd.Sync }} </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </PopoverContent>
      </Popover>
    </div>
  </div>
</template>
