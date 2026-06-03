<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MicrosoftHMDVSDB } from 'edidts'
import { MICROSOFT_HMD_USE_CASES } from 'edidts'

defineProps<{ fields: MicrosoftHMDVSDB }>()

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'

function formatContainerId(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Microsoft HMD VSDB <span class="text-xs text-muted-foreground font-normal">(OUI CA-12-5C)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-1 text-sm">
      <div :class="rowClass">
        <span>Version</span>
        <span class="font-mono">{{ fields.version }}</span>
      </div>
      <div :class="rowClass">
        <span>Desktop Usage</span>
        <span :class="fields.desktopUsage ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.desktopUsage ? 'Yes' : 'No' }}
        </span>
      </div>
      <div :class="rowClass">
        <span>Non-Microsoft Usage</span>
        <span :class="fields.nonMicrosoftUsage ? 'text-emerald-500' : 'text-muted-foreground'">
          {{ fields.nonMicrosoftUsage ? 'Yes' : 'No' }}
        </span>
      </div>
      <div :class="rowClass">
        <span>Primary Use Case</span>
        <span class="font-mono">
          0x{{ fields.primaryUseCase.toString(16).toUpperCase().padStart(2, '0') }}
          &mdash; {{ MICROSOFT_HMD_USE_CASES[fields.primaryUseCase] ?? 'Unknown' }}
        </span>
      </div>
      <div :class="rowClass">
        <span>Container ID</span>
        <span class="font-mono text-xs">{{ formatContainerId(fields.containerId) }}</span>
      </div>
    </CardContent>
  </Card>
</template>
