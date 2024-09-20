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
    <div class="content-center">Colorimetry Data Block</div>
  </div>
  <div class="grid grid-cols-3 gap-2 m-4 p-4 border rounded">
    <div class="content-center">xvYCC601</div>
    <div>
      <Switch v-model:checked="blocks[prop.blockNum].Content.xvYCC601" />
    </div>
    <div></div>
    <div class="content-center">xvYCC709</div>
    <div>
      <Switch v-model:checked="blocks[prop.blockNum].Content.xvYCC709" />
    </div>
    <div></div>
    <div class="content-center">sYCC601</div>
    <div>
      <Switch v-model:checked="blocks[prop.blockNum].Content.sYCC601" />
    </div>
    <div></div>
    <div class="content-center">opYCC601</div>
    <div>
      <Switch v-model:checked="blocks[prop.blockNum].Content.opYCC601" />
    </div>
    <div></div>
    <div class="content-center">opRGB</div>
    <div>
      <Switch v-model:checked="blocks[prop.blockNum].Content.opRGB" />
    </div>
    <div></div>
    <div class="content-center">BT2020cYCC</div>
    <div>
      <Switch v-model:checked="blocks[prop.blockNum].Content.BT2020cYCC" />
    </div>
    <div></div>
    <div class="content-center">BT2020YCC</div>
    <div>
      <Switch v-model:checked="blocks[prop.blockNum].Content.BT2020YCC" />
    </div>
    <div></div>
    <div class="content-center">BT2020RGB</div>
    <div>
      <Switch v-model:checked="blocks[prop.blockNum].Content.BT2020RGB" />
    </div>
    <div></div>
    <div class="content-center">DCI-P3</div>
    <div>
      <Switch v-model:checked="blocks[prop.blockNum].Content.DCI_P3" />
    </div>
    <div></div>
  </div>
</template>
