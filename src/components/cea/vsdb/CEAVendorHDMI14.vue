<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HDMI14VSDB } from 'edidts'

defineProps<{ fields: HDMI14VSDB }>()

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'

function formatPhysAddr(addr: [number, number, number, number]): string {
  return addr.join('.')
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>HDMI 1.4 VSDB <span class="text-xs text-muted-foreground font-normal">(OUI 00-0C-03)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-1 text-sm">
      <div :class="rowClass">
        <span>Physical Address</span>
        <span class="font-mono">{{ formatPhysAddr(fields.sourcePhysicalAddress) }}</span>
      </div>
      <div :class="rowClass">
        <span>Max TMDS Clock</span>
        <span class="font-mono">{{ fields.maxTmdsClockMHz }} MHz</span>
      </div>
      <div :class="rowClass">
        <span>AI Support</span>
        <span :class="fields.supportsAI ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.supportsAI ? 'Yes' : 'No' }}
        </span>
      </div>
      <div :class="rowClass">
        <span>DC Y444</span>
        <span :class="fields.dcY444 ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.dcY444 ? 'Yes' : 'No' }}
        </span>
      </div>
      <div :class="rowClass">
        <span>Deep Color 30-bit</span>
        <span :class="fields.dc30bit ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.dc30bit ? 'Yes' : 'No' }}
        </span>
      </div>
      <div :class="rowClass">
        <span>Deep Color 36-bit</span>
        <span :class="fields.dc36bit ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.dc36bit ? 'Yes' : 'No' }}
        </span>
      </div>
      <div :class="rowClass">
        <span>Deep Color 48-bit</span>
        <span :class="fields.dc48bit ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.dc48bit ? 'Yes' : 'No' }}
        </span>
      </div>
    </CardContent>
  </Card>
</template>
