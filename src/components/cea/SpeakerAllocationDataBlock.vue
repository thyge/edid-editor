<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
const prop = defineProps<{
  blockNum: any;
}>();
const block = edidstore.mEEDID.CEA.DataBlocks[prop.blockNum];
import { Switch } from "@/components/ui/switch";
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div class="content-center">{{ block.Header.Name }}</div>
  </div>
  <div class="grid grid-cols-3 gap-2 m-4 p-4 border rounded">
    <div class="content-center">Front Wide Left & Right</div>
    <div class="content-center">
      <Switch v-model:checked="block.FrontWide_LeftRight" />
    </div>
    <div></div>
    <div class="content-center">Front Center Left & Right</div>
    <div class="content-center">
      <Switch v-model:checked="block.FrontCenter_LeftRight" />
    </div>
    <div></div>
    <div class="content-center">Back Center</div>
    <div class="content-center">
      <Switch v-model:checked="block.BackCenter" />
    </div>
    <div></div>
    <div class="content-center">Back Left & Right</div>
    <div class="content-center">
      <Switch v-model:checked="block.Back_LeftRight" />
    </div>
    <div></div>
    <div class="content-center">Front Center</div>
    <div class="content-center">
      <Switch v-model:checked="block.FrontCenter" />
    </div>
    <div></div>
    <div class="content-center">LFE</div>
    <div class="content-center">
      <Switch v-model:checked="block.LFEChannel" />
    </div>
    <div></div>
    <div class="content-center">Front Left & Right</div>
    <div class="content-center">
      <Switch v-model:checked="block.Front_LeftRight" />
    </div>
    <div></div>
    <div class="content-center">Surround Left & Right</div>
    <div class="content-center">
      <Switch v-model:checked="block.Surround_LeftRight" />
    </div>
    <div></div>
    <div class="content-center">Top Front Center</div>
    <div class="content-center">
      <Switch v-model:checked="block.TopFrontCenter" />
    </div>
    <div></div>
    <div class="content-center">Top Center</div>
    <div class="content-center">
      <Switch v-model:checked="block.TopCenter" />
    </div>
    <div></div>
    <div class="content-center">Top Front Left & Right</div>
    <div class="content-center">
      <Switch v-model:checked="block.TopFront_LeftRight" />
    </div>
    <div></div>
  </div>
</template>
