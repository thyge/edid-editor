<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CircleMinus,
  PlusCircle,
} from "@lucide/vue";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { computed, ref } from "vue";

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

const navItems = computed(() => {
  const items: Array<{ key: 'edid' | 'cea' | 'displayid'; label: string; icon: typeof Monitor }> = [
    { key: "edid", label: "EDID", icon: Monitor },
  ];
  if (edidStore.mEEDID.hasCEA) {
    items.push({ key: "cea", label: "CEA-861", icon: CircuitBoard });
  }
  if (edidStore.mEEDID.hasDisplayID) {
    items.push({ key: "displayid", label: "DisplayID", icon: BadgeCheck });
  }
  return items;
});

const selectedBlockType = ref<'cea' | 'displayid'>("cea");
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
              <div class="flex items-center w-full">
                <SidebarMenuButton
                  class="flex-1"
                  :is-active="uiStore.activeBlock === item.key"
                  @click="uiStore.activeBlock = item.key"
                >
                  <component :is="item.icon" class="size-4" />
                  <span>{{ item.label }}</span>
                </SidebarMenuButton>
                <Button
                  v-if="item.key !== 'edid'"
                  variant="ghost"
                  size="sm"
                  class="h-8 w-8 p-0"
                  :aria-label="`Remove ${item.label} block`"
                  @click.stop="edidStore.removeExtensionBlock(item.key)"
                >
                  <CircleMinus class="size-4" />
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>

          <div class="mt-2 px-2">
            <Dialog>
              <DialogTrigger as-child>
                <Button
                  size="sm"
                  variant="outline"
                  class="w-full"
                  :disabled="edidStore.mEEDID.hasCEA && edidStore.mEEDID.hasDisplayID"
                >
                  <PlusCircle class="size-4 mr-2" />
                  Add Block
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Extension Block</DialogTitle>
                </DialogHeader>
                <Select v-model="selectedBlockType">
                  <SelectTrigger>
                    <SelectValue placeholder="Select block type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cea" :disabled="edidStore.mEEDID.hasCEA">
                      CEA-861
                    </SelectItem>
                    <SelectItem value="displayid" :disabled="edidStore.mEEDID.hasDisplayID">
                      DisplayID
                    </SelectItem>
                  </SelectContent>
                </Select>
                <DialogFooter>
                  <DialogClose as-child>
                    <Button
                      :disabled="(selectedBlockType === 'cea' && edidStore.mEEDID.hasCEA) || (selectedBlockType === 'displayid' && edidStore.mEEDID.hasDisplayID)"
                      @click="edidStore.addExtensionBlock(selectedBlockType)"
                    >
                      Add
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter class="border-t p-4">
      <div class="flex gap-2">
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
