<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { VESAAdaptiveSyncVSDB } from 'edidts'

defineProps<{ fields: VESAAdaptiveSyncVSDB }>()

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>VESA Adaptive-Sync VSDB <span class="text-xs text-muted-foreground font-normal">(OUI 9C-5A-78 &mdash; experimental, unverified OUI)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-1 text-sm">
      <p class="text-xs text-muted-foreground mb-2">OUI and byte layout are not in the public IEEE registry; treat field values as best-effort.</p>
      <div :class="rowClass">
        <span>Fixed Rate Link</span>
        <span :class="fields.fixedRateLink ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.fixedRateLink ? 'Yes' : 'No' }}
        </span>
      </div>
      <div :class="rowClass">
        <span>Min Refresh</span>
        <span class="font-mono">{{ fields.minRefreshHz }} Hz</span>
      </div>
      <div :class="rowClass">
        <span>Max Refresh</span>
        <span class="font-mono">{{ fields.maxRefreshHz }} Hz</span>
      </div>
      <div :class="rowClass">
        <span>Min Backlight</span>
        <span class="font-mono">{{ fields.minBacklightHz }} Hz</span>
      </div>
      <div :class="rowClass">
        <span>Adaptive-Sync Capable</span>
        <span :class="fields.adaptiveSyncCapable ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.adaptiveSyncCapable ? 'Yes' : 'No' }}
        </span>
      </div>
      <div :class="rowClass">
        <span>DSC 8 bpc</span>
        <span :class="fields.dsc8bpc ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.dsc8bpc ? 'Yes' : 'No' }}
        </span>
      </div>
      <div :class="rowClass">
        <span>DSC 10 bpc</span>
        <span :class="fields.dsc10bpc ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.dsc10bpc ? 'Yes' : 'No' }}
        </span>
      </div>
      <div :class="rowClass">
        <span>DSC 12 bpc</span>
        <span :class="fields.dsc12bpc ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.dsc12bpc ? 'Yes' : 'No' }}
        </span>
      </div>
      <div :class="rowClass">
        <span>BCap30</span>
        <span :class="fields.bcap30 ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.bcap30 ? 'Yes' : 'No' }}
        </span>
      </div>
      <div :class="rowClass">
        <span>SelFl</span>
        <span :class="fields.selFl ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.selFl ? 'Yes' : 'No' }}
        </span>
      </div>
      <div :class="rowClass">
        <span>VFR Inactive</span>
        <span :class="fields.vfrInactive ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.vfrInactive ? 'Yes' : 'No' }}
        </span>
      </div>
    </CardContent>
  </Card>
</template>
