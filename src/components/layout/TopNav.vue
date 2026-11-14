<script setup lang="ts">
import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import ModeToggle from '@/components/ModeToggle.vue'
import { Separator } from '@/components/ui/separator'
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar'

const emit = defineEmits<{
  (e: 'import-file', payload: File): void
  (e: 'load-hex', payload: string): void
  (e: 'new-edid'): void
  (e: 'download-bin'): void
  (e: 'download-hex'): void
}>()

/** Whether an EDID is loaded — the download items are disabled otherwise. */
const props = defineProps<{ canDownload: boolean }>()

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const saveShortcut = isMac ? '⌘S' : 'Ctrl+S'

// Ctrl/Cmd+S downloads the edited EDID as .bin instead of saving the web page.
useEventListener(typeof window !== 'undefined' ? window : undefined, 'keydown', (e: KeyboardEvent) => {
  if (e.key.toLowerCase() !== 's' || !(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return
  e.preventDefault()
  if (props.canDownload) emit('download-bin')
})

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
            <MenubarSeparator />
            <MenubarItem :disabled="!canDownload" @click="emit('download-bin')">
              Download EDID (.bin)
              <MenubarShortcut>{{ saveShortcut }}</MenubarShortcut>
            </MenubarItem>
            <MenubarItem :disabled="!canDownload" @click="emit('download-hex')">
              Download as hex text (.txt)
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