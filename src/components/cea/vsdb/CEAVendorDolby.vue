<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DolbyVSDB } from 'edidts'

defineProps<{ fields: DolbyVSDB }>()

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Dolby Vision VSVDB <span class="text-xs text-muted-foreground font-normal">(OUI 00-D0-46)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-1 text-sm">
      <div :class="rowClass">
        <span>Version</span>
        <span class="font-mono">{{ fields.version }}</span>
      </div>
      <div :class="rowClass">
        <span>YUV 4:2:2 12-bit</span>
        <span :class="fields.supportsYUV422_12bit ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.supportsYUV422_12bit ? 'Yes' : 'No' }}
        </span>
      </div>
      <div :class="rowClass">
        <span>2160p60</span>
        <span :class="fields.supports2160p60 ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.supports2160p60 ? 'Yes' : 'No' }}
        </span>
      </div>
      <div :class="rowClass">
        <span>Global Dimming</span>
        <span :class="fields.supportsGlobalDimming ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.supportsGlobalDimming ? 'Yes' : 'No' }}
        </span>
      </div>
    </CardContent>
  </Card>
</template>
