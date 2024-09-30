<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const header = edidstore.mEEDID.CEA.Header;
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { watch } from "vue";
watch(
  () => edidstore.mEEDID.CEA.Header.Version,
  (value) => {
    console.log("Version changed to: " + value);
    edidstore.updateEdid();
  }
);
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div class="content-center">CEA Header</div>
  </div>
  <div class="grid grid-cols-3 gap-2 m-4 p-4 border rounded">
    <div class="content-center">Version</div>
    <div class="content-center">
      <Select
        v-model="edidstore.mEEDID.CEA.Header.Version"
        @update:modelValue="edidstore.updateEdid()"
      >
        <SelectTrigger>
          <SelectValue> </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">1</SelectItem>
          <SelectItem value="2">2</SelectItem>
          <SelectItem value="3">3</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div></div>
    <div class="content-center">Underscan</div>
    <div>
      <Switch
        v-model:checked="header.Underscan"
        @update:checked="edidstore.updateEdid()"
      />
    </div>
    <div></div>
    <div class="content-center">Basic Audio</div>
    <div>
      <Switch
        v-model:checked="header.BasicAudio"
        @update:checked="edidstore.updateEdid()"
      />
    </div>
    <div></div>
    <div class="content-center">YCBCR444</div>
    <div>
      <Switch
        v-model:checked="header.YCBCR444"
        @update:checked="edidstore.updateEdid()"
      />
    </div>
    <div></div>
    <div class="content-center">YCBCR422</div>
    <div>
      <Switch
        v-model:checked="header.YCBCR422"
        @update:checked="edidstore.updateEdid()"
      />
    </div>
    <div></div>
  </div>
</template>
