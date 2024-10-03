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
</script>

<template>
  <template v-for="(block, index) in edidstore.mEEDID.EDID.DisplayDescriptors">
    <div>
      <div class="grid grid-cols-2 gap-2 m-4">
        <div
          v-if="block.Type === DescriptorType.DetailedTimingDescriptor"
          class="content-center"
        >
          Detailed Timing Descriptor
        </div>
        <div
          v-else-if="
            block.Type === DescriptorType.DisplayProductSerialNumber ||
            block.Type === DescriptorType.AlphanumericDataString ||
            block.Type === DescriptorType.DisplayProductName
          "
          class="content-center"
        >
          {{ block.Type }}
        </div>
        <div
          v-else-if="block.Type === DescriptorType.DisplayRangeLimits"
          class="content-center"
        >
          Display Range Limits
        </div>
        <div
          v-if="block.Type != DescriptorType.Dummy"
          class="grid grid-cols-2 gap-2 m-4"
        >
          <div></div>
          <Button
            variant="ghost"
            @click="edidstore.removeBlock(index)"
            :disabled="index === 0 ? true : false"
          >
            <CircleMinus />
          </Button>
        </div>
      </div>
      <div>
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
  </template>
  <div v-if="edidstore.mEEDID.EDID.DisplayDescriptors.length < 4">
    <div class="grid grid-cols-2 gap-2 m-4">
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
                <SelectItem value="DetailedTimingDescriptor"
                  >DetailedTimingDescriptor</SelectItem
                >
                <SelectItem value="DisplayProductSerialNumber"
                  >DisplayProductSerialNumber</SelectItem
                >
                <SelectItem value="AlphanumericDataString"
                  >AlphanumericDataString</SelectItem
                >
                <SelectItem value="DisplayRangeLimits"
                  >DisplayRangeLimits</SelectItem
                >
                <SelectItem value="DisplayProductName"
                  >DisplayProductName</SelectItem
                >
                <SelectItem value="ColorPointData">ColorPointData</SelectItem>
                <SelectItem value="StandardTimingIdentification"
                  >StandardTimingIdentification</SelectItem
                >
                <SelectItem value="DisplayColorManagement"
                  >DisplayColorManagement</SelectItem
                >
                <SelectItem value="CVT3ByteCodes">CVT3ByteCodes</SelectItem>
                <SelectItem value="EstablishedTimingsIII"
                  >EstablishedTimingsIII</SelectItem
                >
              </SelectContent>
            </Select>
            {{ createType }}
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
