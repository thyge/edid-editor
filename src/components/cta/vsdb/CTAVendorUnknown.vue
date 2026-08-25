<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { VendorSpecificDataBlock } from 'edidts'

const props = defineProps<{ block: VendorSpecificDataBlock }>()

function ouiLabel(oui: number): string {
  return oui.toString(16).toUpperCase().padStart(6, '0').match(/.{2}/g)!.join('-')
}

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
