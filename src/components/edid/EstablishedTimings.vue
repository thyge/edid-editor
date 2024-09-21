<script setup lang="ts">
import { useEdidStore } from "@/stores/edidStore";
const edidstore = useEdidStore();
import { Switch } from "@/components/ui/switch";
</script>

<template>
  <div class="grid grid-cols-3 gap-2 m-4">
    <div>Established Timings</div>
  </div>
  <div class="grid grid-cols-6 gap-2 m-4 p-4 border rounded">
    <div>720 x 400 @ 70Hz</div>
    <div>
      <Switch
        v-model:checked="edidstore.mEEDID.EDID.EstablishedTimings.ET720_400_70"
      />
    </div>
    <div>800 x 600 @ 56Hz</div>
    <div>
      <Switch
        v-model:checked="edidstore.mEEDID.EDID.EstablishedTimings.ET800_600_56"
      />
    </div>
    <div>1024 x 768 @ 60Hz</div>
    <div>
      <Switch
        v-model:checked="edidstore.mEEDID.EDID.EstablishedTimings.ET1024_768_60"
      />
    </div>
    <div>720 x 400 @ 88Hz</div>
    <div>
      <Switch
        v-model:checked="edidstore.mEEDID.EDID.EstablishedTimings.ET720_400_88"
      />
    </div>
    <div>800 x 600 @ 60Hz</div>
    <div>
      <Switch
        v-model:checked="edidstore.mEEDID.EDID.EstablishedTimings.ET800_600_60"
      />
    </div>
    <div>1024 x 768 @ 70Hz</div>
    <div>
      <Switch
        v-model:checked="edidstore.mEEDID.EDID.EstablishedTimings.ET1024_768_70"
      />
    </div>
    <div>640 x 480 @ 60Hz</div>
    <div>
      <Switch
        v-model:checked="edidstore.mEEDID.EDID.EstablishedTimings.ET640_480_60"
      />
    </div>
    <div>800 x 600 @ 72Hz</div>
    <div>
      <Switch
        v-model:checked="edidstore.mEEDID.EDID.EstablishedTimings.ET800_600_72"
      />
    </div>
    <div>1024 x 768 @ 75Hz</div>
    <div>
      <Switch
        v-model:checked="edidstore.mEEDID.EDID.EstablishedTimings.ET1024_768_75"
      />
    </div>
    <div>640 x 480 @ 67Hz</div>
    <div>
      <Switch
        v-model:checked="edidstore.mEEDID.EDID.EstablishedTimings.ET640_480_67"
      />
    </div>
    <div>800 x 600 @ 75Hz</div>
    <div>
      <Switch
        v-model:checked="edidstore.mEEDID.EDID.EstablishedTimings.ET800_600_75"
      />
    </div>
    <div>1280 x 1024 @ 75Hz</div>
    <div>
      <Switch
        v-model:checked="
          edidstore.mEEDID.EDID.EstablishedTimings.ET1280_1024_75
        "
      />
    </div>
    <div>640 x 480 @ 72Hz</div>
    <div>
      <Switch
        v-model:checked="edidstore.mEEDID.EDID.EstablishedTimings.ET640_480_72"
      />
    </div>
    <div>832 x 624 @ 75Hz</div>
    <div>
      <Switch
        v-model:checked="edidstore.mEEDID.EDID.EstablishedTimings.ET832_624_75"
      />
    </div>
    <div>1152 x 870 @ 75Hz</div>
    <div>
      <Switch
        v-model:checked="edidstore.mEEDID.EDID.EstablishedTimings.ET1152_870_75"
      />
    </div>
    <div>640 x 480 @ 75Hz</div>
    <div>
      <Switch
        v-model:checked="edidstore.mEEDID.EDID.EstablishedTimings.ET640_480_75"
      />
    </div>
    <div>1024 x 768 @ 87Hz Interlaced</div>
    <div>
      <Switch
        v-model:checked="edidstore.mEEDID.EDID.EstablishedTimings.ET1024_768_87"
      />
    </div>
  </div>
</template>
