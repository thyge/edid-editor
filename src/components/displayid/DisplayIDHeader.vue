<script setup lang="ts">
import type { DisplayIdExtensionBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

defineProps<{
  displayId: DisplayIdExtensionBlock
}>()

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

function emitNumber(field: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  emit('update', field, Number.isFinite(value) ? value : 0)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>DisplayID Header</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Version</h4>
        <div class="grid grid-cols-3 gap-x-6 gap-y-2">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Version</label>
            <Input :model-value="displayId.section.version" disabled />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Revision</label>
            <Input :model-value="displayId.section.revision" disabled />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Version Byte</label>
            <Input :model-value="`0x${displayId.section.versionByte.toString(16).padStart(2, '0')}`" disabled />
          </div>
        </div>
      </section>

      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Section Fields</h4>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Primary Use Case</label>
            <Input
              type="number"
              min="0"
              max="255"
              :model-value="displayId.section.primaryUseCase"
              @input="emitNumber('primaryUseCase', $event)"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Extension Count</label>
            <Input
              type="number"
              min="0"
              max="255"
              :model-value="displayId.section.extensionCount"
              @input="emitNumber('extensionCount', $event)"
            />
          </div>
        </div>
      </section>
    </CardContent>
  </Card>
</template>
