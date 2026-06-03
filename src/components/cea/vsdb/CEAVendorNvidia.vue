<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { NvidiaVSDB } from 'edidts'

defineProps<{ fields: NvidiaVSDB }>()

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>NVIDIA VSDB <span class="text-xs text-muted-foreground font-normal">(OUI 00-04-4B &mdash; experimental)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-1 text-sm">
      <p class="text-xs text-muted-foreground mb-2">Byte layout is not publicly documented; this is a best-effort decoder.</p>
      <div :class="rowClass">
        <span>Version</span>
        <span class="font-mono">{{ fields.version }}</span>
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
        <span>Flags</span>
        <span class="font-mono">0x{{ fields.flags.toString(16).toUpperCase().padStart(2, '0') }}</span>
      </div>
    </CardContent>
  </Card>
</template>
