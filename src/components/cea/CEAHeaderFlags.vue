<script setup lang="ts">
import type { CEAExtensionBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

const selectClass = 'flex h-8 w-full rounded-md border border-input dark:bg-input/30 bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
const switchRowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2 hover:bg-muted/50 transition-colors'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>CEA Header & Flags</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <section>
        <div class="max-w-xs space-y-1">
          <label class="text-xs text-muted-foreground">CEA Version</label>
          <select
            :value="cea.revision"
            :class="selectClass"
            @change="(e: Event) => emit('update', 'revision', parseInt((e.target as HTMLSelectElement).value, 10))"
          >
            <option :value="1">Version 1</option>
            <option :value="2">Version 2</option>
            <option :value="3">Version 3</option>
          </select>
        </div>
      </section>

      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Capability Flags (Byte 3)</h4>
        <div class="grid grid-cols-2 gap-x-6 gap-y-2">
          <label :class="switchRowClass">
            <div>
              <span>Underscan <span class="text-muted-foreground font-normal">(bit 7)</span></span>
              <p class="text-xs text-muted-foreground">Sink underscans IT Video Formats by default</p>
            </div>
            <Switch
              :checked="cea.underscan"
              @update:checked="(v: boolean) => emit('update', 'underscan', v)"
            />
          </label>
          <label :class="switchRowClass">
            <div>
              <span>Basic Audio <span class="text-muted-foreground font-normal">(bit 6)</span></span>
              <p class="text-xs text-muted-foreground">Sink supports Basic Audio</p>
            </div>
            <Switch
              :checked="cea.basicAudio"
              @update:checked="(v: boolean) => emit('update', 'basicAudio', v)"
            />
          </label>
          <label :class="switchRowClass">
            <div>
              <span>YCbCr 4:4:4 <span class="text-muted-foreground font-normal">(bit 5)</span></span>
              <p class="text-xs text-muted-foreground">Sink supports YCbCr 4:4:4 in addition to RGB</p>
            </div>
            <Switch
              :checked="cea.ycbcr444"
              @update:checked="(v: boolean) => emit('update', 'ycbcr444', v)"
            />
          </label>
          <label :class="switchRowClass">
            <div>
              <span>YCbCr 4:2:2 <span class="text-muted-foreground font-normal">(bit 4)</span></span>
              <p class="text-xs text-muted-foreground">Sink supports YCbCr 4:2:2 in addition to RGB</p>
            </div>
            <Switch
              :checked="cea.ycbcr422"
              @update:checked="(v: boolean) => emit('update', 'ycbcr422', v)"
            />
          </label>
        </div>


      </section>
    </CardContent>
  </Card>
</template>
