<script setup lang="ts">
import { ref, computed } from 'vue'
import { VIC_TABLE, getVICDefinition, isVICDtdEncodable } from 'edidts'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { ChevronsUpDown, Check } from '@lucide/vue'

/**
 * Searchable CTA-861 VIC picker (combobox over {@link VIC_TABLE}). The shadcn
 * Command filters on each item's rendered text content, so the user can
 * search by VIC number, resolution, or refresh rate. Emits the selected VIC
 * number (or null); controlled by `modelValue`.
 *
 * Two uses:
 *  - DTD authoring (`cea-861` mode, the default): only VICs the DTD can hold
 *    byte-exactly are selectable. Writing a DTD-unencodable VIC (e.g.
 *    4096-wide 4K, 1188 MHz 4K120, or a wide-front-porch format) would
 *    silently truncate DTD fields on encode, so the list is filtered by
 *    {@link isVICDtdEncodable} — the field-width rule lives in edidts,
 *    single-sourced with the encoder. A DTD loaded from a file may still
 *    MATCH an excluded VIC; the preselect label renders via
 *    {@link getVICDefinition} regardless of filtering.
 *  - Short Video Descriptor lists (`dtdEncodableOnly: false`): every VIC in
 *    the table, 8K/10K VICs 193–219 included, minus the `exclude` list.
 */
const props = withDefaults(
  defineProps<{
    modelValue: number | null
    /** Only offer VICs a DTD can hold (DTD authoring). */
    dtdEncodableOnly?: boolean
    /** VIC numbers to leave out (e.g. ones already in the list). */
    exclude?: number[]
    placeholder?: string
    disabled?: boolean
    /** Tooltip explaining why the picker is disabled. */
    disabledReason?: string | null
  }>(),
  { dtdEncodableOnly: true, exclude: () => [], placeholder: 'Select VIC…', disabled: false, disabledReason: null },
)
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const open = ref(false)

/** DTD-encodable subset, computed once (the check builds a DTD per VIC). */
const dtdEncodableVics = VIC_TABLE.filter((vic) => isVICDtdEncodable(vic))

const selectableVics = computed(() => {
  const base = props.dtdEncodableOnly ? dtdEncodableVics : VIC_TABLE
  if (props.exclude.length === 0) return base
  const excluded = new Set(props.exclude)
  return base.filter((vic) => !excluded.has(vic.vic))
})

const selectedLabel = computed(() => {
  if (props.modelValue == null) return props.placeholder
  const def = getVICDefinition(props.modelValue)
  return def ? `VIC ${def.vic} · ${def.name}` : `VIC ${props.modelValue}`
})

function selectVic(vic: number): void {
  emit('update:modelValue', vic)
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :disabled="disabled"
        :title="disabled && disabledReason ? disabledReason : undefined"
        :class="[
          'h-9 w-full justify-between font-normal',
          modelValue == null && 'text-muted-foreground',
        ]"
      >
        <span class="truncate">{{ selectedLabel }}</span>
        <ChevronsUpDown class="size-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-80 p-0" align="start">
      <Command>
        <CommandInput placeholder="Search VIC, resolution, refresh…" />
        <CommandList>
          <CommandEmpty>No matching VIC.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="vic in selectableVics"
              :key="vic.vic"
              :value="String(vic.vic)"
              @select="() => selectVic(vic.vic)"
            >
              <Check
                class="size-4 shrink-0"
                :class="modelValue === vic.vic ? 'opacity-100' : 'opacity-0'"
              />
              <span class="w-10 shrink-0 font-mono text-xs text-muted-foreground">{{ vic.vic }}</span>
              <span class="truncate">{{ vic.name }}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
