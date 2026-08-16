<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AMDFreeSyncVSDB } from 'edidts'

defineProps<{ fields: AMDFreeSyncVSDB }>()

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>AMD FreeSync VSDB <span class="text-xs text-muted-foreground font-normal">(OUI 00-00-1A)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-1 text-sm">
      <p class="text-xs text-muted-foreground mb-2">Byte layout reverse-engineered from real EDIDs (edid-decode <code>cta_amd</code>); the 2.x extension is preserved verbatim.</p>
      <div :class="rowClass">
        <span>Version</span>
        <span class="font-mono">{{ fields.versionMajor }}.{{ fields.versionMinor }}</span>
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
        <span>Flags 1.x</span>
        <span class="font-mono">0x{{ fields.flags1.toString(16).toUpperCase().padStart(2, '0') }}</span>
      </div>
    </CardContent>
  </Card>
</template>