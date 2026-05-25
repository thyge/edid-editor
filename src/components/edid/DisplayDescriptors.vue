<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import DetailedTimingDescriptor from "../DetailedTimingDesciptor.vue";
import { DescriptorType, descriptorTypeOptions } from "edidts";
import ASCIIDescriptor from "./descriptors/ASCIIDescriptor.vue";
import DisplayRangeLimits from "./descriptors/DisplayRangeLimits.vue";
import ColorPointData from "./descriptors/ColorPointData.vue";
import { Button } from "@/components/ui/button";
import { CircleMinus, CogIcon, PlusCircle } from "@lucide/vue";
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
import StandardTiming from "./StandardTiming.vue";
import DisplayColorManagement from "./descriptors/ColorManagementData.vue";
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
            v-if="block.kind === 'detailedTiming'"
            :block="block"
            :id="index"
          />
          <ASCIIDescriptor
            v-else-if="
              block.kind === 'displayProductSerialNumber' ||
              block.kind === 'alphanumericDataString' ||
              block.kind === 'displayProductName'
            "
            :block="block"
            :id="index"
          />
          <DisplayRangeLimits
            v-else-if="block.kind === 'displayRangeLimits'"
            :block="block"
            :id="index"
          />
          <ColorPointData
            v-else-if="block.kind === 'colorPointData'"
            :block="block"
            :id="index"
          />
          <div
            v-else-if="block.kind === 'standardTimingIdentification'"
          >
            <template v-for="(timing, tIndex) in block.timings">
              <StandardTiming :id="tIndex + 8" :timing="timing" />
            </template>
          </div>
          <div
            v-else-if="block.kind === 'displayColorManagement'"
          >
            <DisplayColorManagement :block="block"/>
          </div>
          <div
            v-else-if="
              block.kind === 'cvt3ByteCodes' ||
              block.kind === 'establishedTimingsIII'
            "
          >
            {{ block }}
          </div>
          <div v-else>
            <div class="grid grid-cols-4 gap-2 m-4">
              <div class="content-center col-span-3">
                Unknown descriptor
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
                <SelectItem
                  v-for="opt in descriptorTypeOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
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
