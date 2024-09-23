<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const prop = defineProps<{
  blockNum: any;
}>();
import { Switch } from "@/components/ui/switch";
const blocks = edidstore.mEEDID.CEA.DataBlocks;
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div class="content-center">{{ blocks[prop.blockNum].Header.Name }}</div>
  </div>
  <div class="grid grid-cols-3 gap-2 m-4 p-4 border rounded">
    <div class="content-center">HLG</div>
    <div>
      <Switch v-model:checked="blocks[prop.blockNum].HLG" />
    </div>
    <div></div>
    <div class="content-center">ST2084</div>
    <div>
      <Switch v-model:checked="blocks[prop.blockNum].ST2084" />
    </div>
    <div></div>
    <div class="content-center">HDR</div>
    <div>
      <Switch v-model:checked="blocks[prop.blockNum].HDR" />
    </div>
    <div></div>
    <div class="content-center">SDR</div>
    <div>
      <Switch v-model:checked="blocks[prop.blockNum].SDR" />
    </div>
    <div></div>
    <div class="content-center">Static Metadata Type 1</div>
    <div>
      <Switch
        v-model:checked="blocks[prop.blockNum].StaticMetadataType1"
      />
    </div>
  </div>
</template>
