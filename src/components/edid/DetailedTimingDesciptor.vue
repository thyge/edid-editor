<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
const prop = defineProps<{
  block: any;
}>();
const dtd = prop.block;
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
</script>

<template>
  <div>
    <div class="gap-2 m-4">
      <div>Detailed Timing Descriptor</div>
    </div>
    <div class="gap-2 p-4 m-4 border rounded">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger
            >{{ dtd.HorizontalActive }}x{{ dtd.VerticalActive }}@{{
              dtd.VerticalRefreshRate
            }}p - {{ dtd.PixelClockKHz / 1000000 }}Khz</AccordionTrigger
          >
          <AccordionContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Pixel Clock</TableCell>
                  <TableCell>{{ dtd.PixelClockKHz / 1000000 }}</TableCell>
                  <TableCell>Interlaced</TableCell>
                  <TableCell>{{ dtd.Interlaced }}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Horizontal Active Pixels</TableCell>
                  <TableCell>{{ dtd.HorizontalActive }}</TableCell>
                  <TableCell>Vertical Active Pixels</TableCell>
                  <TableCell>{{ dtd.VerticalActive }}</TableCell>
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
                  <TableCell>{{ dtd.VerticalRefreshRate }}</TableCell>
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div>
        <Button>Edit Timing</Button>
      </div>
    </div>
  </div>
</template>
