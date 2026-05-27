<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const emit = defineEmits<{
  (e: 'load-hex', hex: string): void
  (e: 'load-file', file: File): void
}>()

const hexInput = ref('')
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) {
    emit('load-file', file)
  }
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    emit('load-file', file)
  }
}

function handlePaste() {
  if (hexInput.value.trim()) {
    emit('load-hex', hexInput.value)
  }
}

function openFileDialog() {
  fileInput.value?.click()
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Load EDID</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div
        class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
        :class="isDragging ? 'border-primary bg-primary/5' : 'border-border'"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <p class="text-muted-foreground mb-2">
          Drag & drop an EDID file here
        </p>
        <p class="text-sm text-muted-foreground mb-4">
          Supports .bin, .edid, or .txt (hex) files
        </p>
        <Button variant="outline" @click="openFileDialog">
          Browse Files
        </Button>
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          accept=".bin,.edid,.txt"
          @change="handleFileSelect"
        />
      </div>

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <span class="w-full border-t" />
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-background px-2 text-muted-foreground">Or paste hex</span>
        </div>
      </div>

      <div>
        <textarea
          v-model="hexInput"
          class="w-full h-24 p-3 text-sm font-mono bg-secondary rounded-lg border-0 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="00 FF FF FF FF FF FF 00 ..."
        />
        <Button 
          class="mt-2 w-full" 
          :disabled="!hexInput.trim()"
          @click="handlePaste"
        >
          Parse EDID
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
