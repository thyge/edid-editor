<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import DetailedTimingDescriptor from "../DetailedTimingDesciptor.vue";
import { DescriptorType } from "../../edidjs/edid_descriptors";
import ASCIIDescriptor from "./descriptors/ASCIIDescriptor.vue";
import DisplayRangeLimits from "./descriptors/DisplayRangeLimits.vue";
import { Button } from "@/components/ui/button";
import { CircleMinus, CogIcon, PlusCircle } from "lucide-vue-next";
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
const createType: DescriptorType = DescriptorType.DetailedTimingDescriptor;
import Descriptor from "./Descriptor.vue";
</script>

<template>
  <template v-for="(block, index) in edidstore.mEEDID.EDID.DisplayDescriptors">
    <div>
      <div class="gap-2 p-4 m-4 border rounded">
        <div class="flex justify-between">
          <div class="content-center">{{ block.Type }}</div>
          <Button
            variant="ghost"
            @click="edidstore.removeBlock(index)"
            :disabled="index === 0 ? true : false"
          >
            <CircleMinus />
          </Button>
        </div>

        <div class="p-2">
          <DetailedTimingDescriptor
            v-if="block.Type === DescriptorType.DetailedTimingDescriptor"
            :block="block"
            :id="index"
          />
          <ASCIIDescriptor
            v-else-if="
              block.Type === DescriptorType.DisplayProductSerialNumber ||
              block.Type === DescriptorType.AlphanumericDataString ||
              block.Type === DescriptorType.DisplayProductName
            "
            :block="block"
            :id="index"
          />
          <DisplayRangeLimits
            v-else-if="block.Type === DescriptorType.DisplayRangeLimits"
            :block="block"
            :id="index"
          />
          <div v-else-if="block.Type != DescriptorType.Dummy">
            <div class="grid grid-cols-4 gap-2 m-4">
              <div class="content-center col-span-3">
                {{ block.Type }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  <div v-if="edidstore.mEEDID.EDID.DisplayDescriptors.length < 4">
    <div class="flex justify-between gap-2 p-4 m-4">
      <div class="content-center">Add Block</div>
      <div class="grid grid-cols-2 gap-2 m-4">
        <div></div>
        <Dialog>
          <DialogTrigger>
            <PlusCircle />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Desciptor</DialogTitle>
            </DialogHeader>
            <Select v-model="createType">
              <SelectTrigger>
                <SelectValue> </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Detailed Timing Descriptor">
                  Detailed Timing Descriptor
                </SelectItem>
                <SelectItem value="Display Product Serial Number">
                  Display Product Serial Number
                </SelectItem>
                <SelectItem value="Alphanumeric Data String">
                  Alphanumeric Data String
                </SelectItem>
                <SelectItem value="Display Range Limits">
                  Display Range Limits
                </SelectItem>
                <SelectItem value="Display Product Name">
                  Display Product Name
                </SelectItem>
                <SelectItem value="Color Point Data">
                  Color Point Data
                </SelectItem>
                <SelectItem value="Standard Timing Identification">
                  Standard Timing Identification
                </SelectItem>
                <SelectItem value="Display Color Management">
                  Display Color Management
                </SelectItem>
                <SelectItem value="CVT 3 Byte Codes">
                  CVT 3 Byte Codes
                </SelectItem>
                <SelectItem value="Established Timings III">
                  Established Timings III
                </SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter>
              <DialogClose as-child>
                <Button type="submit" @click="edidstore.addBlock(createType)">
                  Save changes
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </div>
</template>
