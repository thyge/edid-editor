<script setup lang="ts">
import { Switch } from "@/components/ui/switch";
import { ColorimetryDataBlock } from "edidts";
const prop = defineProps<{
  block: ColorimetryDataBlock;
}>();
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div class="content-center">{{ block.Header.Name }}</div>
  </div>
  <div class="grid grid-cols-3 gap-2 m-4 p-4 border rounded">
    <div class="content-center">xvYCC601</div>
    <div>
      <Switch v-model:checked="block.xvYCC601" />
    </div>
    <div></div>
    <div class="content-center">xvYCC709</div>
    <div>
      <Switch v-model:checked="block.xvYCC709" />
    </div>
    <div></div>
    <div class="content-center">sYCC601</div>
    <div>
      <Switch v-model:checked="block.sYCC601" />
    </div>
    <div></div>
    <div class="content-center">opYCC601</div>
    <div>
      <Switch v-model:checked="block.opYCC601" />
    </div>
    <div></div>
    <div class="content-center">opRGB</div>
    <div>
      <Switch v-model:checked="block.opRGB" />
    </div>
    <div></div>
    <div class="content-center">BT2020cYCC</div>
    <div>
      <Switch v-model:checked="block.BT2020cYCC" />
    </div>
    <div></div>
    <div class="content-center">BT2020YCC</div>
    <div>
      <Switch v-model:checked="block.BT2020YCC" />
    </div>
    <div></div>
    <div class="content-center">BT2020RGB</div>
    <div>
      <Switch v-model:checked="block.BT2020RGB" />
    </div>
    <div></div>
    <div class="content-center">DCI-P3</div>
    <div>
      <Switch v-model:checked="block.DCIP3" />
    </div>
    <div></div>
  </div>
</template>
