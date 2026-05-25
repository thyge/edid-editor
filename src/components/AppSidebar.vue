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
  Download,
  FileText,
  CircleMinus,
  PlusCircle,
  ChevronRight,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { ref, watch } from "vue";

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

const selectedBlockType = ref<'cea' | 'displayid'>("cea");

const isEdidOpen = ref(true);
const isCeaOpen = ref(false);
const isDisplayIdOpen = ref(false);

watch(
  () => uiStore.activeBlock,
  (block) => {
    isEdidOpen.value = block === "edid";
    isCeaOpen.value = block === "cea";
    isDisplayIdOpen.value = block === "displayid";
  }
);
</script>

<template>
  <Sidebar>
    <SidebarHeader class="border-b p-4">
      <div class="text-sm font-medium text-foreground">
        {{ edidStore.mEEDID.EDID.displayProductName || "EDID Editor" }}
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
            <!-- EDID -->
            <Collapsible v-model:open="isEdidOpen" as-child class="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton tooltip="EDID">
                    <Monitor class="size-4" />
                    <span>EDID</span>
                    <ChevronRight
                      class="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        :is-active="uiStore.activeBlock === 'edid' && uiStore.activeSubSection === 'header'"
                        @click="uiStore.navigateTo('edid', 'header')"
                      >
                        <span>Header</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        :is-active="uiStore.activeBlock === 'edid' && uiStore.activeSubSection === 'displayParameters'"
                        @click="uiStore.navigateTo('edid', 'displayParameters')"
                      >
                        <span>Display Parameters</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        :is-active="uiStore.activeBlock === 'edid' && uiStore.activeSubSection === 'chromaticity'"
                        @click="uiStore.navigateTo('edid', 'chromaticity')"
                      >
                        <span>Chromaticity</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        :is-active="uiStore.activeBlock === 'edid' && uiStore.activeSubSection === 'establishedTimings'"
                        @click="uiStore.navigateTo('edid', 'establishedTimings')"
                      >
                        <span>Established Timings</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        :is-active="uiStore.activeBlock === 'edid' && uiStore.activeSubSection === 'standardTimings'"
                        @click="uiStore.navigateTo('edid', 'standardTimings')"
                      >
                        <span>Standard Timings</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        :is-active="uiStore.activeBlock === 'edid' && uiStore.activeSubSection === 'displayDescriptors'"
                        @click="uiStore.navigateTo('edid', 'displayDescriptors')"
                      >
                        <span>Display Descriptors</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <!-- CEA-861 -->
            <Collapsible
              v-if="edidStore.mEEDID.hasCEA"
              v-model:open="isCeaOpen"
              as-child
              class="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton tooltip="CEA-861">
                    <CircuitBoard class="size-4" />
                    <span>CEA-861</span>
                    <ChevronRight
                      class="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <SidebarMenuAction
                  show-on-hover
                  aria-label="Remove CEA-861 block"
                  @click="edidStore.removeExtensionBlock('cea')"
                >
                  <CircleMinus class="size-4" />
                </SidebarMenuAction>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        :is-active="uiStore.activeBlock === 'cea' && uiStore.activeSubSection === 'header'"
                        @click="uiStore.navigateTo('cea', 'header')"
                      >
                        <span>Header</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem
                      v-for="(block, index) in edidStore.mEEDID.CEA.DataBlocks"
                      :key="'block-' + index"
                    >
                      <SidebarMenuSubButton
                        :is-active="uiStore.activeBlock === 'cea' && uiStore.activeSubSection === 'block-' + index"
                        @click="uiStore.navigateTo('cea', 'block-' + index)"
                      >
                        <span>{{ block.Header.Name }}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem
                      v-for="(dtd, index) in edidStore.mEEDID.CEA.DetailedTimingBlocks"
                      :key="'dtd-' + index"
                    >
                      <SidebarMenuSubButton
                        :is-active="uiStore.activeBlock === 'cea' && uiStore.activeSubSection === 'dtd-' + index"
                        @click="uiStore.navigateTo('cea', 'dtd-' + index)"
                      >
                        <span
                          >{{ dtd.HorizontalActive }}x{{ dtd.VerticalActive }}@{{
                            Math.round(dtd.VerticalRefreshRate)
                          }}p</span
                        >
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <!-- DisplayID -->
            <Collapsible
              v-if="edidStore.mEEDID.hasDisplayID"
              v-model:open="isDisplayIdOpen"
              as-child
              class="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton tooltip="DisplayID">
                    <BadgeCheck class="size-4" />
                    <span>DisplayID</span>
                    <ChevronRight
                      class="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <SidebarMenuAction
                  show-on-hover
                  aria-label="Remove DisplayID block"
                  @click="edidStore.removeExtensionBlock('displayid')"
                >
                  <CircleMinus class="size-4" />
                </SidebarMenuAction>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        :is-active="uiStore.activeBlock === 'displayid' && uiStore.activeSubSection === 'header'"
                        @click="uiStore.navigateTo('displayid', 'header')"
                      >
                        <span>Header</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
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
