<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ouiLabel } from '../vendorLabels'

/**
 * Raw-bytes fallback card for vendor blocks without a structured editor —
 * unregistered tag-0x03 VSDBs and tag-0x07 VSVDBs alike (the carriers share
 * the { ieeeOui, vendorPayload } shape), so the prop is structural.
 */
const props = defineProps<{ block: { ieeeOui: number; vendorPayload: Uint8Array } }>()

function hexDump(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Unknown VSDB <span class="text-xs text-muted-foreground font-normal">(OUI {{ ouiLabel(block.ieeeOui) }})</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-2 text-sm">
      <p class="text-muted-foreground">No decoder registered for this OUI. Raw bytes preserved for round-trip.</p>
      <pre class="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto">{{ hexDump(block.vendorPayload) }}</pre>
    </CardContent>
  </Card>
</template>
