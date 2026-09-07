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
 * Searchable CTA-861 VIC picker (combobox over {@link VIC_TABLE}) used as the
 * sole free-parameter control in `cea-861` authoring mode. The shadcn Command
 * filters on each item's rendered text content, so the user can search by VIC
 * number, resolution, or refresh rate. Emits the selected VIC number (or null);
 * controlled by `modelValue`.
 *
 * Only VICs the DTD can hold byte-exactly are selectable: writing a
 * DTD-unencodable VIC (e.g. 4096-wide 4K, 1188 MHz 4K120, or a wide-front-porch
 * format) would silently truncate DTD fields on encode, so the dropdown list is
 * filtered by {@link isVICDtdEncodable} (TASK-122) — the field-width rule lives
 * in edidts, single-sourced with the encoder. A DTD loaded from a file may
 * still MATCH an excluded VIC; the preselect label renders via
 * {@link getVICDefinition} regardless of filtering.
 */
const props = defineProps<{ modelValue: number | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const open = ref(false)

/** Selectable VICs only — the DTD-encodable subset of the table. */
const selectableVics = VIC_TABLE.filter((vic) => isVICDtdEncodable(vic))

const selectedLabel = computed(() => {
  if (props.modelValue == null) return 'Select VIC…'
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