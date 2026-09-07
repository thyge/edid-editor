<script setup lang="ts">
import { ref } from 'vue'
import ModeToggle from '@/components/ModeToggle.vue'
import { Separator } from '@/components/ui/separator'
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar'

const emit = defineEmits<{
  (e: 'import-file', payload: File): void
  (e: 'load-hex', payload: string): void
  (e: 'new-edid'): void
}>()

/** Hex viewer visibility, owned by App.vue (persisted there). */
const hexViewer = defineModel<boolean>('hexViewer', { default: true })

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

const scrollToOverview = () => {
  document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <header class="h-14 border-b border-border bg-background px-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <h1 class="text-lg font-semibold">EDID</h1>
      <Separator orientation="vertical" class="h-6" />
      <Menubar class="border-0 shadow-none">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem @click="emit('new-edid')">New EDID</MenubarItem>
            <MenubarSeparator />
            <MenubarItem @click="fileInputRef?.click()">
              Import from file…
            </MenubarItem>
            <MenubarItem @click="handleLoadHex()">
              Import from hex string…
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem
              :model-value="hexViewer"
              @update:model-value="(v: boolean | 'indeterminate') => (hexViewer = v === true)"
            >
              Hex Viewer
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarItem @click="scrollToOverview">Overview</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
    <div class="flex items-center gap-4">
      <p class="hidden md:block text-xs text-muted-foreground">
        Drag &amp; drop an EDID file anywhere to load it
      </p>
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