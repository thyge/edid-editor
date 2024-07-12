<script setup lang="ts">
import { ref } from "vue";
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
</script>

<template>
  <Card>
    <div class="grid grid-cols-8">
      <template v-for="(byte, index) in edidstore.mEEDID.EDID.raw">
        <div class="w-6 h-6 flex items-center justify-center">
          {{ byte.toString(16).toUpperCase() }}
        </div>
      </template>
    </div>
  </Card>
</template>
