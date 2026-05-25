<script setup lang="ts">
import { useUiStore } from "@/stores/uiStore";
import EDIDView from "@/components/EDIDView.vue";
import CEAView from "@/components/CEAView.vue";
import DisplayIDView from "@/components/DisplayIDView.vue";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar.vue";
import SidebarRight from "@/components/SidebarRight.vue";
import ModeToggle from "@/components/ModeToggle.vue";
import { useEdidStore } from "@/stores/edidStore";
import { PanelRight } from "@lucide/vue";
import { EEDID, hexToUint8Array } from "edidts";

const edidstore = useEdidStore();
const uiStore = useUiStore();

const txtEdid =
  "00,FF,FF,FF,FF,FF,FF,00,34,A9,1C,D1,01,01,01,01," +
  "00,19,01,03,80,DD,7D,78,0A,06,12,AF,51,4E,AD,24," +
  "0B,4C,51,20,08,00,A9,C0,A9,40,90,40,01,01,01,01," +
  "01,01,01,01,01,01,08,E8,00,30,F2,70,5A,80,B0,58," +
  "8A,00,1C,00,74,00,00,1E,02,3A,80,18,71,38,2D,40," +
  "58,2C,45,00,1C,00,74,00,00,1E,00,00,00,FC,00,45," +
  "54,2D,4D,44,4E,48,4D,31,30,0A,20,20,00,00,00,FD," +
  "00,17,79,0F,96,3C,00,0A,20,20,20,20,20,20,01,75," +
  "02,03,41,B1,57,61,60,5F,5E,5D,66,65,64,63,62,3F," +
  "10,1F,05,14,22,21,20,04,13,02,11,01,E3,05,E0,00," +
  "6E,03,0C,00,10,00,38,3C,20,08,80,01,02,03,04,67," +
  "D8,5D,C4,01,78,80,03,E2,00,FF,E2,0F,63,E3,06,0D," +
  "01,28,3C,80,A0,70,B0,23,40,30,20,36,00,66,00,64," +
  "00,00,1A,00,00,00,00,00,00,00,00,00,00,00,00,00," +
  "00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,00," +
  "00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,5A";
edidstore.mEEDID = EEDID.decode(hexToUint8Array(txtEdid));
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header class="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background">
        <div class="flex flex-1 items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" class="mr-2 h-4" />
          <div class="ml-auto flex items-center gap-2">
            <ModeToggle />
            <Button
              variant="ghost"
              size="icon"
              class="h-7 w-7"
              :class="{ 'bg-accent': uiStore.showHexView }"
              @click="uiStore.showHexView = !uiStore.showHexView"
            >
              <PanelRight />
              <span class="sr-only">Toggle Hex View</span>
            </Button>
          </div>
        </div>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4">
        <EDIDView v-if="uiStore.activeBlock === 'edid'" />
        <CEAView v-else-if="uiStore.activeBlock === 'cea'" />
        <DisplayIDView v-else-if="uiStore.activeBlock === 'displayid'" />
      </div>
    </SidebarInset>
    <SidebarRight />
  </SidebarProvider>
</template>

<style scoped></style>
