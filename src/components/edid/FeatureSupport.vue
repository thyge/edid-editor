<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { Switch } from "@/components/ui/switch";
import { ref } from "vue";
const featureSupport = ref(edidstore.mEEDID.EDID.FeatureSupport);
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div>Feature Support</div>
  </div>
  <div class="grid grid-cols-3 gap-2 m-4 p-4 border rounded">
    <div>DPMS Standby</div>
    <div>
      <Switch
        :disabled="edidstore.mEEDID.EDID.Revision < 4"
        v-model:checked="featureSupport.DPMSstandby"
        @update:checked="edidstore.setHeader()"
      />
    </div>
    <div>EDID 1.4 Only</div>
    <div>DPMS Suspend</div>
    <div>
      <Switch
        :disabled="edidstore.mEEDID.EDID.Revision < 4"
        v-model:checked="featureSupport.DPMSsuspend"
        @update:checked="edidstore.setHeader()"
      />
    </div>
    <div>EDID 1.4 Only</div>
    <div>DPMS ActiveOff</div>
    <div>
      <Switch
        :disabled="edidstore.mEEDID.EDID.Revision < 4"
        v-model:checked="featureSupport.DPMSactiveOff"
        @update:checked="edidstore.setHeader()"
      />
    </div>
    <div>EDID 1.4 Only</div>
    <div>Native Pixel Format in Preferred Timing Mode</div>
    <div>
      <Switch
        v-model:checked="featureSupport.PreferredTiming"
        @update:checked="edidstore.setHeader()"
      />
    </div>
    <div></div>
    <template v-if="edidstore.mEEDID.EDID.Revision < 4">
      <div>GTF Support</div>
      <div>
        <Switch
          v-model:checked="featureSupport.GTFSupport"
          @update:checked="edidstore.setHeader()"
        />
      </div>
      <div>No encoding support</div>
    </template>
    <template v-if="edidstore.mEEDID.EDID.Revision > 3">
      <div>Continuous Frequency</div>
      <div>
        <Switch
          v-model:checked="featureSupport.ContiniousFrequency"
          @update:checked="edidstore.setHeader()"
        />
      </div>
      <div>No encoding support</div>
    </template>
  </div>
</template>
