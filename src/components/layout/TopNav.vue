<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
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

const emit = defineEmits<{
  (e: 'import-file', payload: File): void
  (e: 'load-hex', payload: string): void
  (e: 'new-edid'): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

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
