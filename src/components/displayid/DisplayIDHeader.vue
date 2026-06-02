<script setup lang="ts">
import { computed } from 'vue'
import type { DisplayIdExtensionBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const props = defineProps<{
  displayId: DisplayIdExtensionBlock
}>()

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

const primaryUseCaseInvalid = computed(() =>
  props.displayId.section.primaryUseCase < 0 || props.displayId.section.primaryUseCase > 255
)
const extensionCountInvalid = computed(() =>
  props.displayId.section.extensionCount < 0 || props.displayId.section.extensionCount > 255
)

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
              :aria-invalid="primaryUseCaseInvalid"
              :model-value="displayId.section.primaryUseCase"
              @input="emitNumber('primaryUseCase', $event)"
            />
            <p v-if="primaryUseCaseInvalid" class="text-xs text-destructive">Value must fit in one byte.</p>
          </div>
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Extension Count</label>
            <Input
              type="number"
              min="0"
              max="255"
              :aria-invalid="extensionCountInvalid"
              :model-value="displayId.section.extensionCount"
              @input="emitNumber('extensionCount', $event)"
            />
            <p v-if="extensionCountInvalid" class="text-xs text-destructive">Value must fit in one byte.</p>
          </div>
        </div>
      </section>
    </CardContent>
  </Card>
</template>
