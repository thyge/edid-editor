<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import ModeToggle from '@/components/ModeToggle.vue'
import { Separator } from '@/components/ui/separator'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { useEdidSlots } from '@/composables/useEdidSlots'

const props = defineProps<{
  hasEdid: boolean
  edidName: string | null
  edidData: Uint8Array | null
}>()

const emit = defineEmits<{
  (e: 'load-slot', payload: Uint8Array): void
  (e: 'import-file', payload: File): void
  (e: 'load-hex', payload: string): void
  (e: 'new-edid'): void
}>()

const { slots, saveSlot, loadSlot, addSlot, removeSlot, moveSlot } = useEdidSlots()
const fileInputRef = ref<HTMLInputElement | null>(null)

const canSave = computed(() => props.hasEdid && props.edidData !== null)
const visibleSlots = computed(() => slots.value.slice(0, 3))

const handleSlotSave = (index: number) => {
  if (!props.edidData) {
    return
  }
  saveSlot(index, props.edidData, props.edidName)
}

const handleSlotLoad = (index: number) => {
  const bytes = loadSlot(index)
  if (!bytes) {
    return
  }
  emit('load-slot', bytes)
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    return
  }
  emit('import-file', file)
  target.value = ''
}

const handleLoadHex = () => {
  if (typeof window === 'undefined') {
    return
  }
  const hex = window.prompt('Paste EDID hexadecimal data (spaces allowed)')
  if (!hex) {
    return
  }
  emit('load-hex', hex)
}

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const describeTimestamp = (updatedAt: string | null) => {
  if (!updatedAt) {
    return 'No EDID stored'
  }

  const date = new Date(updatedAt)
  if (Number.isNaN(date.getTime())) {
    return 'Saved'
  }

  return `Saved ${timestampFormatter.format(date)}`
}

const fileActions = [
  {
    label: 'New EDID',
    description: 'Start from a blank 128-byte block',
    handler: () => emit('new-edid'),
  },
  {
    label: 'Import from file',
    description: 'Upload .edid, .bin, .raw, .dat, or .txt',
    handler: () => fileInputRef.value?.click(),
  },
  {
    label: 'Import from hex string',
    description: 'Paste raw hexadecimal data',
    handler: () => handleLoadHex(),
  },
]

const handleSlotAdd = () => {
  addSlot()
}

const handleSlotDelete = (index: number) => {
  removeSlot(index)
}

const handleSlotMove = (index: number, direction: number) => {
  moveSlot(index, index + direction)
}

</script>

<template>
  <header class="h-14 border-b border-border bg-background px-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <h1 class="text-lg font-semibold">EDID</h1>
      <Separator orientation="vertical" class="h-6" />
      <nav aria-label="Primary" class="text-sm text-muted-foreground">
        <NavigationMenu class="max-w-none">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger :class="navigationMenuTriggerStyle()">
                File
              </NavigationMenuTrigger>
                <NavigationMenuContent>
                <ul class="grid w-[320px] gap-3 p-4 md:w-[360px]" role="menu">
                  <li v-for="action in fileActions" :key="action.label" role="none">
                    <NavigationMenuLink as-child>
                      <button
                        type="button"
                        class="select-none space-y-1 rounded-lg border border-transparent px-3 py-2 text-left no-underline outline-none transition-colors hover:border-border hover:bg-muted focus-visible:border-primary focus-visible:bg-muted"
                        role="menuitem"
                        @click="action.handler()"
                      >
                        <div class="text-sm font-semibold leading-none text-foreground">
                          {{ action.label }}
                        </div>
                        <p class="text-xs text-muted-foreground">
                          {{ action.description }}
                        </p>
                      </button>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink :class="navigationMenuTriggerStyle()" as-child>
                <a href="#overview" class="text-sm font-medium">
                  View
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink :class="navigationMenuTriggerStyle()" as-child>
                <button type="button" class="text-sm font-medium">
                  Help
                </button>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
      <Separator orientation="vertical" class="h-6 hidden md:block" />
      <div class="flex items-center gap-4 min-w-0">
        <NavigationMenu class="max-w-none">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger :class="navigationMenuTriggerStyle()">
                EDID Storage
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div class="w-[320px] space-y-2 p-3 md:w-[360px]">
                  <div
                    v-for="slot in slots"
                    :key="slot.index"
                    class="flex items-center gap-2 rounded-md border border-transparent px-2.5 py-1.5 text-left transition-colors hover:border-border hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring"
                    :title="slot.data ? `Slot ${slot.index + 1} • ${describeTimestamp(slot.updatedAt)}` : `Slot ${slot.index + 1} • No EDID stored yet`"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="text-xs font-semibold uppercase tracking-wide text-foreground truncate">
                        {{ slot.label || 'Empty' }}
                      </p>
                      <p class="text-[11px] text-muted-foreground">
                        Slot {{ slot.index + 1 }} ·
                        {{ slot.data ? describeTimestamp(slot.updatedAt) : 'No data' }}
                      </p>
                    </div>
                    <div class="flex items-center gap-1 text-muted-foreground">
                      <Button
                        size="icon"
                        variant="ghost"
                        class="h-7 w-7"
                        :disabled="!slot.data"
                        aria-label="Load slot"
                        @click.stop="handleSlotLoad(slot.index)"
                      >
                        <Icon icon="radix-icons:download" class="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        class="h-7 w-7"
                        :disabled="!canSave"
                        aria-label="Save slot"
                        @click.stop="handleSlotSave(slot.index)"
                      >
                        <Icon icon="radix-icons:upload" class="size-3.5" />
                      </Button>
                      <span class="w-px h-5 bg-border" aria-hidden="true" />
                      <Button
                        size="icon"
                        variant="ghost"
                        class="h-7 w-7"
                        :disabled="slot.index === 0"
                        aria-label="Move slot up"
                        @click.stop="handleSlotMove(slot.index, -1)"
                      >
                        <Icon icon="radix-icons:arrow-up" class="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        class="h-7 w-7"
                        :disabled="slot.index === slots.length - 1"
                        aria-label="Move slot down"
                        @click.stop="handleSlotMove(slot.index, 1)"
                      >
                        <Icon icon="radix-icons:arrow-down" class="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        class="h-7 w-7 text-destructive"
                        aria-label="Delete slot"
                        @click.stop="handleSlotDelete(slot.index)"
                      >
                        <Icon icon="radix-icons:trash" class="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    class="w-full justify-center text-xs font-semibold"
                    variant="secondary"
                    @click.stop="handleSlotAdd"
                  >
                    <Icon icon="radix-icons:plus" class="mr-2 size-4" />
                    Add slot
                  </Button>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div class="flex items-center gap-2 overflow-x-auto py-1 flex-nowrap">
          <div
            v-for="slot in visibleSlots"
            :key="`inline-slot-${slot.index}`"
            class="relative flex items-center gap-2 rounded-lg border border-border/70 bg-background/90 px-2.5 py-1.5 flex-shrink-0 w-[180px] shadow-[0_2px_8px_-4px_rgba(15,23,42,0.25)]"
          >
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide truncate">
                {{ slot.label || 'Empty' }}
              </p>
            </div>
            <div class="flex items-center gap-1 ml-auto">
              <span
                class="inline-flex items-center justify-center rounded-full bg-muted size-5 text-muted-foreground"
                :title="slot.data ? `Slot ${slot.index + 1} • ${describeTimestamp(slot.updatedAt)}` : `Slot ${slot.index + 1} • No EDID stored yet`"
              >
                <Icon icon="radix-icons:info-circled" class="size-3.5" />
              </span>
              <Button
                size="sm"
                variant="secondary"
                class="h-7 px-2 text-[10px]"
                :disabled="!slot.data"
                @click="handleSlotLoad(slot.index)"
              >
                Load
              </Button>
              <Button
                size="sm"
                variant="outline"
                class="h-7 px-2 text-[10px]"
                :disabled="!canSave"
                @click="handleSlotSave(slot.index)"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <ModeToggle />
    </div>
    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      accept=".edid,.bin,.raw,.dat,.txt"
      @change="handleFileChange"
    />
  </header>
</template>
