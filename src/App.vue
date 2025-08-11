<script setup lang="ts">
import EDIDView from "@/components/EDIDView.vue";
import CEAView from "./components/CEAView.vue";
import DisplayID from "./components/DisplayIDView.vue";
import NavBar from "./components/NavBar.vue";
import { useEdidStore } from "./stores/edidStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const edidstore = useEdidStore();
let txtEdid =
  "00,ff,ff,ff,ff,ff,ff,00,32,f2,00,00,00,00,00,00,\
01,18,01,04,b0,34,20,78,17,ee,91,a3,54,4c,99,26,\
0f,50,54,00,00,00,01,01,01,01,01,01,01,01,01,01,\
01,01,01,01,01,01,08,e8,00,30,f2,70,5a,80,b0,58,\
8a,00,00,70,f8,00,00,1e,00,00,00,fb,00,01,00,00,\
00,00,01,00,00,00,00,00,00,00,00,00,00,fa,00,01,\
00,01,00,01,00,01,00,01,00,01,00,00,00,00,00,f9,\
00,00,00,00,00,00,00,00,00,00,00,00,00,00,01,82,\
02,03,1a,f1,41,61,83,01,00,00,67,03,0c,00,00,00,\
00,77,67,d8,5d,c4,01,44,88,01,00,00,00,00,00,00,\
00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,\
00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,\
00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,\
00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,\
00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,\
00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,af";
txtEdid = txtEdid.replaceAll(",", "");
txtEdid = txtEdid.replaceAll(" ", "");
let byts = Uint8Array.from(
  txtEdid.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
);
edidstore.mEEDID.ParseEEDID(byts);
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
