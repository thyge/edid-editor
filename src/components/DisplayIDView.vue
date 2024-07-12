<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
function handleRemoveBlock(element: number) {
  blocks.splice(element, 1);
  console.log(element);
}
function handleAddBlock() {
  console.log("add block diag");
}
</script>

<template>
  <div class="grid grid-cols-7 gap-1">
    <Card class="col-span-2">
      <Button
        @click="
          displayElement = 'header';
          selectedBlock = 0;
        "
        variant="ghost"
        class="w-3/4 justify-start"
        >Header</Button
      >
      <template v-for="(block, index) in blocks">
        <Button
          v-if="block.Header.Type === 'DBUseExtendedTag' | block.Header.Type === 'DBVendorSpecificDataBlock'"
          variant="ghost"
          class="w-3/4 justify-start"
          @click="
            displayElement = 'block';
            selectedBlock = index;
          "
          >{{ block.Content.ExtendedName }}</Button
        >
        <Button
          v-else
          variant="ghost"
          class="w-3/4 justify-start"
          @click="
            displayElement = 'block';
            selectedBlock = index;
          "
          >{{ block.Header.Type }}</Button
        >
        <Button @click="handleRemoveBlock(index)" variant="ghost" class="w-1/4"
          ><Trash
        /></Button>
      </template>

      <Button :disabled="true" variant="ghost" class="w-3/4"></Button>
      <Button @click="handleAddBlock()" variant="ghost" class="w-1/4"
        ><CirclePlus
      /></Button>
    </Card>
    Not implemented yet
  </div>
</template>
