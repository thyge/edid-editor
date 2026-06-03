<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HDR10PlusVSDB } from 'edidts'

defineProps<{ fields: HDR10PlusVSDB }>()

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>HDR10+ VSDB <span class="text-xs text-muted-foreground font-normal">(OUI 8B-84-90 &mdash; experimental)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-1 text-sm">
      <p class="text-xs text-muted-foreground mb-2">Byte layout is not publicly documented; this is a best-effort decoder.</p>
      <div :class="rowClass">
        <span>Application Identifier</span>
        <span class="font-mono">0x{{ fields.applicationIdentifier.toString(16).toUpperCase().padStart(2, '0') }}</span>
      </div>
      <div :class="rowClass">
        <span>Application Version</span>
        <span class="font-mono">0x{{ fields.applicationVersion.toString(16).toUpperCase().padStart(2, '0') }}</span>
      </div>
    </CardContent>
  </Card>
</template>
