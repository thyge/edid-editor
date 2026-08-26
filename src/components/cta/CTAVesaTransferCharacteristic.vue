<script setup lang="ts">
import { computed } from 'vue'
import type { CEAExtensionBlock, VESADisplayTransferCharacteristicBlock } from 'edidts'
import { VESA_TRANSFER_TYPE_OPTIONS } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { updateArrayItem } from '../common/editorUtils'

const props = defineProps<{ cea: CEAExtensionBlock }>()

const emit = defineEmits<{
  update: [block: VESADisplayTransferCharacteristicBlock | undefined, field: string, value: unknown]
}>()

const block = computed(() =>
  props.cea.dataBlocks.find(b => b.tag === 0x05) as VESADisplayTransferCharacteristicBlock | undefined
)

const selectClass =
  'flex h-8 w-full rounded-md border border-input bg-transparent dark:bg-input/30 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

const transferTypeOptions = VESA_TRANSFER_TYPE_OPTIONS

function setGamma(i: number, v: string | number) {
  if (!block.value) return
  const n = typeof v === 'number' ? v : Number(v)
  const clamped = Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0
  emit('update', block.value, 'gammaValues', updateArrayItem(block.value.gammaValues, i, clamped))
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>VESA Display Transfer Characteristic <span class="text-xs text-muted-foreground font-normal">(tag 5)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-3 text-sm">
      <p v-if="!block" class="text-muted-foreground">No VESA Display Transfer Characteristic Data Block present.</p>
      <template v-else>
        <div class="grid grid-cols-2 gap-x-6 gap-y-2">
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Transfer Type
            <select
              :class="selectClass"
              :value="block.transferType"
              @change="(e: Event) => emit('update', block, 'transferType', (e.target as HTMLSelectElement).value)"
            >
              <option v-for="opt in transferTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </label>
          <!--
            numEntries (8/16/32/48) is displayed read-only: the CTA data-block
            length field is 5 bits (max 31 bytes), so only 8 and 16 entries fit a
            single block; 32/48 are not CTA-encodable. Resizing block.payload on a
            count change would risk overflow, so the count is left as decoded.
          -->
          <label class="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Entries
            <Input :model-value="block.numEntries" readonly />
          </label>
        </div>

        <div v-if="block.gammaValues.length > 0">
          <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Gamma Values (normalized 0–1)</h4>
          <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
            <label
              v-for="(g, i) in block.gammaValues"
              :key="i"
              class="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              #{{ i }}
              <Input type="number" :min="0" :max="1" :step="0.01" :model-value="g" @update:model-value="(v) => setGamma(i, v)" />
            </label>
          </div>
        </div>
      </template>
    </CardContent>
  </Card>
</template>