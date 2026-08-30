<script setup lang="ts">
import { ref, computed } from 'vue'
import { VIC_TABLE, getVICDefinition } from 'edidts'
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
 */
const props = defineProps<{ modelValue: number | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const open = ref(false)

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
              v-for="vic in VIC_TABLE"
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