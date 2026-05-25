<script setup lang="ts">
import { Switch } from "@/components/ui/switch";
import { HDRStaticMetadataDataBlock } from "@/edidts";
const prop = defineProps<{
  block: HDRStaticMetadataDataBlock;
}>();
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div class="content-center">{{ block.Header.Name }}</div>
  </div>
  <div class="grid grid-cols-3 gap-2 m-4 p-4 border rounded">
    <div class="content-center">HLG</div>
    <div>
      <Switch v-model:checked="block.HLG" />
    </div>
    <div></div>
    <div class="content-center">ST2084</div>
    <div>
      <Switch v-model:checked="block.ST2084" />
    </div>
    <div></div>
    <div class="content-center">HDR</div>
    <div>
      <Switch v-model:checked="block.HDR" />
    </div>
    <div></div>
    <div class="content-center">SDR</div>
    <div>
      <Switch v-model:checked="block.SDR" />
    </div>
    <div></div>
    <div class="content-center">Static Metadata Type 1</div>
    <div>
      <Switch
        v-model:checked="block.StaticMetadataType1"
      />
    </div>
  </div>
</template>
