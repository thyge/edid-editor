<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { Input } from '@/components/ui/input'

/**
 * A single annotated number on the {@link TimingRasterDiagram}: a tiny
 * mono value with a lowercase caption. When `editable`, the value is a
 * button that swaps in place for a micro `<Input>` on click (Enter/blur
 * commits the raw string upward as a number, Escape cancels); when not,
 * it renders as inert dimmed text (derived values like back porches and
 * totals, or generator/VIC-locked fields — the parent decides via
 * {@link isTimingFieldEditable}).
 *
 * `tone` tints the digits (the parent passes the callout's segment color,
 * pre-dimmed for locked fields); the caption stays muted. `align="end"`
 * right-aligns value and caption so a stack of these forms a flush column
 * (CAD callout style). Editable values carry a dashed underline in the
 * digits' own color at rest so the edit affordance is visible without
 * hovering; inert (locked/derived) values render plain.
 *
 * The raw draft is emitted unclamped — the parent owns clamping through
 * the shared {@link clampTimingField} so every edit site commits the
 * exact same value.
 */
const props = withDefaults(defineProps<{
  /** Current field value to display / seed the draft with. */
  value: number
  /** Whether clicking swaps in an inline editor. */
  editable?: boolean
  /** Tiny caption shown under the number (e.g. "fp", "sync"). */
  caption?: string
  /** Tooltip text (field name + unit) for the number. */
  hint?: string
  /** CSS color for the digits (segment tone); caption stays muted. */
  tone?: string
  /** Stack alignment: center (default) or right-flush ("end"). */
  align?: 'center' | 'end'
}>(), { editable: false, caption: undefined, hint: undefined, tone: undefined, align: 'center' })

const emit = defineEmits<{
  commit: [value: number]
}>()

const editing = ref(false)
const draft = ref('')
const inputEl = ref<InstanceType<typeof Input> | null>(null)

watch(editing, async (on) => {
  if (!on) return
  draft.value = String(props.value)
  await nextTick()
  const el = inputEl.value?.$el as HTMLInputElement | undefined
  el?.focus()
  el?.select()
})

/** Commit on Enter/blur — the parent clamps and routes the value. */
function commit(): void {
  if (!editing.value) return
  editing.value = false
  const parsed = Number(draft.value)
  if (Number.isFinite(parsed)) emit('commit', parsed)
}

function cancel(): void {
  editing.value = false
}
</script>

<template>
  <span
    class="inline-flex flex-col leading-none"
    :class="align === 'end' ? 'items-end' : 'items-center'"
    :title="hint"
  >
    <!-- Micro inline editor: shadcn Input sized down to fit the diagram
         annotation slots. -->
    <Input
      v-if="editing"
      ref="inputEl"
      v-model="draft"
      type="number"
      step="1"
      class="h-7 w-16 rounded-none border-border/60 px-1 text-center font-mono text-xs shadow-none"
      @keydown.enter.prevent="commit"
      @keydown.escape.prevent="cancel"
      @blur="commit"
    />
    <button
      v-else-if="editable"
      type="button"
      class="rounded-none border-b border-dashed border-current px-1 pb-px font-mono text-xs tabular-nums hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      :style="tone ? { color: tone } : undefined"
      @click="editing = true"
    >{{ value }}</button>
    <span
      v-else
      class="px-1 font-mono text-xs tabular-nums"
      :style="tone ? { color: tone } : undefined"
    >{{ value }}</span>
    <span
      v-if="caption"
      class="mt-0.5 px-1 text-[10px] uppercase tracking-wide text-muted-foreground/70"
    >{{ caption }}</span>
  </span>
</template>