<script setup lang="ts">
import { computed } from 'vue'
import {
  DISPLAY_ID_PRIMARY_USE_CASES,
  DISPLAY_ID_RESERVED_USE_CASES,
  type DisplayIdExtension,
} from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const props = defineProps<{
  displayId: DisplayIdExtension
}>()

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

// DisplayID v2.0 §2 primary use case option arrays (defined 0x0–0x8 and
// reserved 0x9–0xF) are sourced from the edidts lib (section.ts).
const PRIMARY_USE_CASES = DISPLAY_ID_PRIMARY_USE_CASES
const RESERVED_USE_CASES = DISPLAY_ID_RESERVED_USE_CASES

const primaryUseCase = computed(() => props.displayId.section.primaryUseCase)
const primaryUseCaseValue = computed(() => String(primaryUseCase.value))

// Value outside the spec's 0x0–0xF nibble (e.g. a corrupt byte); preserved as a
// synthetic option so it stays visible and round-trips on encode.
const outOfRange = computed(() => primaryUseCase.value > 0xf)
const outOfRangeLabel = computed(() => `0x${primaryUseCase.value.toString(16).toUpperCase()} — Out of range`)

const primaryUseCaseInvalid = computed(() =>
  props.displayId.section.primaryUseCase < 0 || props.displayId.section.primaryUseCase > 255
)
const extensionCountInvalid = computed(() =>
  props.displayId.section.extensionCount < 0 || props.displayId.section.extensionCount > 255
)

function onPrimaryUseCaseChange(value: unknown) {
  if (value == null) return
  emit('update', 'primaryUseCase', Number(value))
}

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
            <Select
              :model-value="primaryUseCaseValue"
              @update:model-value="onPrimaryUseCaseChange"
            >
              <SelectTrigger
                class="w-full"
                :aria-invalid="primaryUseCaseInvalid"
              >
                <SelectValue placeholder="Select a use case" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Defined</SelectLabel>
                  <SelectItem
                    v-for="useCase in PRIMARY_USE_CASES"
                    :key="useCase.value"
                    :value="String(useCase.value)"
                  >
                    {{ useCase.label }}
                  </SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Reserved</SelectLabel>
                  <SelectItem
                    v-for="useCase in RESERVED_USE_CASES"
                    :key="useCase.value"
                    :value="String(useCase.value)"
                  >
                    {{ useCase.label }}
                  </SelectItem>
                  <SelectItem v-if="outOfRange" :value="primaryUseCaseValue">
                    {{ outOfRangeLabel }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p v-if="outOfRange" class="text-xs text-destructive">
              Value is outside the spec's 0x0–0xF range (0x{{ primaryUseCase.toString(16).toUpperCase() }}).
            </p>
            <p v-else-if="primaryUseCaseInvalid" class="text-xs text-destructive">Value must fit in one byte.</p>
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
