<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Monitor,
  CircuitBoard,
  BadgeCheck,
  Upload,
  Download,
  FileText,
} from "@lucide/vue";

const edidStore = useEdidStore();
const uiStore = useUiStore();

function uploadFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  const ext = file.name.split(".").pop();
  if (ext === "bin") {
    reader.onload = (event) => {
      const edidarr = new Uint8Array(event.target?.result as ArrayBuffer);
      edidStore.mEEDID.ParseEEDID(edidarr);
    };
    reader.readAsArrayBuffer(file);
  } else if (ext === "txt") {
    reader.onload = (event) => {
      let txtEdid = ((event.target?.result as string) ?? "").replaceAll(",", "");
      txtEdid = txtEdid.replaceAll(" ", "");
      const edidarr = Uint8Array.from(
        (txtEdid.match(/.{1,2}/g) ?? []).map((byte: string) => parseInt(byte, 16))
      );
      edidStore.mEEDID.ParseEEDID(edidarr);
    };
    reader.readAsText(file);
  }
}

function toHexString(byte: number) {
  if (byte > 15) return (byte & 0xff).toString(16);
  return "0" + (byte & 0xff).toString(16);
}

function downloadBinFile() {
  const edidarr = edidStore.mEEDID.raw;
  const blob = new Blob([edidarr as unknown as BlobPart], {
    type: "application/octet-stream",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "edid.bin";
  a.click();
}

function downloadTxtFile() {
  const edidarr = edidStore.mEEDID.raw;
  let txtEdid = "";
  for (let i = 0; i < edidarr.length; i++) {
    if (i % 16 === 0) txtEdid += "\n";
    txtEdid += toHexString(edidarr[i]) + ",";
  }
  const blob = new Blob([txtEdid], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "edid.txt";
  a.click();
}

const navItems = [
  { key: "edid" as const, label: "EDID", icon: Monitor },
  { key: "cea" as const, label: "CEA-861", icon: CircuitBoard },
  { key: "displayid" as const, label: "DisplayID", icon: BadgeCheck },
];
</script>

<template>
  <Sidebar>
    <SidebarHeader class="border-b p-4">
      <div class="text-sm font-medium text-foreground">
        {{ edidStore.getDisplayProductName || "EDID Editor" }}
      </div>
      <div class="mt-2">
        <Label for="upload" class="text-xs text-muted-foreground">Upload EDID</Label>
        <Input
          id="upload"
          type="file"
          accept=".bin,.txt"
          @change="uploadFile"
          class="mt-1"
        />
      </div>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Blocks</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in navItems" :key="item.key">
              <SidebarMenuButton
                :is-active="uiStore.activeBlock === item.key"
                @click="uiStore.activeBlock = item.key"
              >
                <component :is="item.icon" class="size-4" />
                <span>{{ item.label }}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter class="border-t p-4">
      <div class="flex items-center justify-between">
        <span class="text-xs text-muted-foreground">Hex View</span>
        <Switch v-model:checked="uiStore.showHexView" />
      </div>
      <div class="mt-3 flex gap-2">
        <Button size="sm" variant="outline" class="flex-1" @click="downloadBinFile">
          <Download class="size-4 mr-1" />
          <span>.bin</span>
        </Button>
        <Button size="sm" variant="outline" class="flex-1" @click="downloadTxtFile">
          <FileText class="size-4 mr-1" />
          <span>.txt</span>
        </Button>
      </div>
    </SidebarFooter>
  </Sidebar>
</template>
