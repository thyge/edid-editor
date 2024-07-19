<script setup lang="ts">
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEdidStore } from "../stores/edidStore";
const edidStore = useEdidStore();
import { useColorMode } from "@vueuse/core";
import { Icon } from "@iconify/vue";
const mode = useColorMode();
function uploadFile(e) {
  let file = e.target.files[0];
  if (typeof file === "undefined" || file === null) {
    return;
  }
  let reader = new FileReader();
  if (file.name.split(".").pop() === "bin") {
    reader.onload = function (event) {
      let edidarr = new Uint8Array(event.target.result);
      edidStore.mEEDID.ParseEEDID(edidarr);
    };
    reader.readAsArrayBuffer(file);
  } else if (file.name.split(".").pop() === "txt") {
    reader.onload = function (event) {
      let txtEdid = event.target.result.replaceAll(",", "");
      txtEdid = txtEdid.replaceAll(" ", "");
      let edidarr = Uint8Array.from(
        txtEdid.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
      );
      edidStore.mEEDID.ParseEEDID(edidarr);
    };
    reader.readAsText(file);
  }
}
</script>

<template>
  <Menubar>
    <MenubarMenu>
      <MenubarTrigger>File</MenubarTrigger>
      <MenubarContent>
        <MenubarItem>
          <div class="grid w-full max-w-sm items-center gap-1.5">
            <Label for="picture">Upload EDID</Label>
            <Input
              @change="uploadFile"
              id="picture"
              type="file"
              accept=".bin, .txt"
            />
          </div>
        </MenubarItem>
        <MenubarItem> Download </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
      <MenubarTrigger>View</MenubarTrigger>
      <MenubarContent>
        <MenubarCheckboxItem checked>Hex Viewer</MenubarCheckboxItem>
      </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
      <MenubarTrigger>EDIDs</MenubarTrigger>
      <template v-for="ed in edidStore">
        <MenubarContent>
          <MenubarCheckboxItem>edid</MenubarCheckboxItem>
        </MenubarContent>
      </template>
    </MenubarMenu>
    <MenubarMenu>
      <MenubarTrigger>
        <Icon
          icon="radix-icons:moon"
          class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        />
        <Icon
          icon="radix-icons:sun"
          class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        />
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem @click="mode = 'light'"> Light </MenubarItem>
        <MenubarItem @click="mode = 'dark'"> Dark </MenubarItem>
        <MenubarItem @click="mode = 'auto'"> System </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
</template>
