<script setup lang="ts">
import EDIDView from "@/components/EDIDView.vue";
import CEAView from "./components/CEAView.vue";
import DisplayID from "./components/DisplayIDView.vue";
import NavBar from "./components/NavBar.vue";
import { useEdidStore } from "./stores/edidStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const edidstore = useEdidStore();
let txtEdid =
  "00,FF,FF,FF,FF,FF,FF,00,34,A9,1C,D1,01,01,01,01,\
              00,19,01,03,80,DD,7D,78,0A,06,12,AF,51,4E,AD,24,\
              0B,4C,51,20,08,00,A9,C0,A9,40,90,40,01,01,01,01,\
              01,01,01,01,01,01,08,E8,00,30,F2,70,5A,80,B0,58,\
              8A,00,1C,00,74,00,00,1E,02,3A,80,18,71,38,2D,40,\
              58,2C,45,00,1C,00,74,00,00,1E,00,00,00,FC,00,45,\
              54,2D,4D,44,4E,48,4D,31,30,0A,20,20,00,00,00,FD,\
              00,17,79,0F,96,3C,00,0A,20,20,20,20,20,20,01,75,\
              02,03,41,B1,57,61,60,5F,5E,5D,66,65,64,63,62,3F,\
              10,1F,05,14,22,21,20,04,13,02,11,01,E3,05,E0,00,\
              6E,03,0C,00,10,00,38,3C,20,08,80,01,02,03,04,67,\
              D8,5D,C4,01,78,80,03,E2,00,FF,E2,0F,63,E3,06,0D,\
              01,28,3C,80,A0,70,B0,23,40,30,20,36,00,66,00,64,\
              00,00,1A,00,00,00,00,00,00,00,00,00,00,00,00,00,\
              00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,\
              00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,5A";
txtEdid = txtEdid.replaceAll(",", "");
txtEdid = txtEdid.replaceAll(" ", "");
let byts = Uint8Array.from(
  txtEdid.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
);
edidstore.mEEDID.ParseEEDID(byts);
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-vue-next'
</script>

<template>
  <NavBar></NavBar>

  <Tabs default-value="edid">
    <TabsList class="grid w-full grid-cols-3">
      <TabsTrigger value="edid"> EDID </TabsTrigger>
      <TabsTrigger value="cea"> CEA </TabsTrigger>
      <TabsTrigger value="displayid"> DisplayID </TabsTrigger>
    </TabsList>
    <TabsContent value="edid">
      <EDIDView />
    </TabsContent>
    <TabsContent value="cea">
      <CEAView />
    </TabsContent>
    <TabsContent value="displayid">
      <DisplayID />
    </TabsContent>
  </Tabs>
</template>

<style scoped></style>
