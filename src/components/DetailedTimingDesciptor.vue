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
} from '@/components/ui/dialog'
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
</script>

<template>
  <div>
    <div class="grid grid-cols-2 gap-2 p-4 m-4 border rounded">
      <div class="content-center">
        {{ dtd.HorizontalActive }} x {{ dtd.VerticalActive }}@{{
          dtd.VerticalRefreshRate.toFixed(2)
        }}p - {{ (dtd.PixelClockKHz / 1000000).toFixed(2) }}Khz
      </div>

      <Dialog>
        <DialogTrigger> <Button>Edit Timing</Button> </DialogTrigger>
        <DialogContent class="sm:max-w-[600px] grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90dvh]">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>CVT Mode</TableCell>
                <TableCell>{{ dtd.CVTMode }}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Pixel Clock</TableCell>
                <TableCell>{{ dtd.PixelClockKHz / 1000000 }} MHz</TableCell>
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
                <TableCell>Sync Type</TableCell>
                <TableCell>
                  <Select v-model="dtd.SyncDefinition.SyncType">
                    <SelectTrigger>
                      <SelectValue></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Analog Composite"
                        >Analog Composite</SelectItem
                      >
                      <SelectItem value="Bipolar Analog Composite"
                        >Bipolar Analog Composite</SelectItem
                      >
                      <SelectItem value="Digital Composite"
                        >Digital Composite</SelectItem
                      >
                      <SelectItem value="Digital Separate"
                        >Digital Separate</SelectItem
                      >
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>Stereo Viewing Support</TableCell>
                <TableCell>
                  <Select v-model="dtd.StereoMode">
                    <SelectTrigger>
                      <SelectValue></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No Stereo">No Stereo</SelectItem>
                      <SelectItem value="Field Sequential Right on Even"
                        >Field Sequential Right on Even</SelectItem
                      >
                      <SelectItem value="Field Sequential Left on Even"
                        >Field Sequential Left on Even</SelectItem
                      >
                      <SelectItem value="2-way interleaved"
                        >2-way interleaved</SelectItem
                      >
                      <SelectItem value="4-way interleaved"
                        >4-way interleaved</SelectItem
                      >
                      <SelectItem value="Side by Side">Side by Side</SelectItem>
                      <SelectItem value="Top and Bottom"
                        >Top and Bottom</SelectItem
                      >
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
              <template
                v-if="
                  dtd.SyncDefinition.SyncType ===
                  SyncType.BipolarAnalogComposite
                "
              >
                <TableRow>
                  <TableCell>Serrations</TableCell>
                  <TableCell>
                    <Switch v-model:checked="dtd.SyncDefinition.Serrations" />
                  </TableCell>
                  <TableCell>Sync On</TableCell>
                  <TableCell>
                    <Select v-model="dtd.SyncDefinition.SyncOn">
                      <SelectTrigger>
                        <SelectValue></SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Green Only">Green Only</SelectItem>
                        <SelectItem value="On all three (RGB)">
                          On all three (RGB)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              </template>
              <template
                v-else-if="
                  dtd.SyncDefinition.SyncType === SyncType.DigitalComposite
                "
              >
                <TableRow>
                  <TableCell>Serrations</TableCell>
                  <TableCell>
                    <Switch v-model:checked="dtd.SyncDefinition.Serrations" />
                  </TableCell>
                </TableRow>
              </template>
              <template
                v-else-if="
                  dtd.SyncDefinition.SyncType === SyncType.DigitalSeparate
                "
              >
                <TableRow>
                  <TableCell>Horizontal Sync</TableCell>
                  <TableCell>
                    <Select v-model="dtd.SyncDefinition.HorizontalSync">
                      <SelectTrigger>
                        <SelectValue></SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Positive">Positive</SelectItem>
                        <SelectItem value="Negative">Negative</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>Vertical Sync</TableCell>
                  <TableCell>
                    <Select v-model="dtd.SyncDefinition.VerticalSync">
                      <SelectTrigger>
                        <SelectValue></SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Positive">Positive</SelectItem>
                        <SelectItem value="Negative">Negative</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              </template>
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>
