<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type ComponentPublicInstance } from 'vue'
import { computeRefreshRate, type DetailedTiming } from 'edidts'
import TimingRasterNumber from './TimingRasterNumber.vue'
import {
  clampTimingField,
  isTimingFieldEditable,
  type TimingEditorMode,
  type TimingFieldMaxKey,
} from '@/composables/useTimingEditorState'

/**
 * Time-domain raster map for a DetailedTiming (VESA timing-generator
 * orientation), both axes cut at the same phase — the end of the sync
 * pulse — so the top-left origin is one coherent moment: the first pixel
 * after H sync ends, on the first line after V sync ends. The frame runs
 * V back porch → active lines → V front porch → V sync down its height,
 * the sync pulse closing the frame (vertical blanking is whole horizontal
 * lines, so the VBP band spans the full width at the top and the
 * VFP+VSYNC bands at the bottom); each line runs H back porch →
 * H active → H front porch → H sync, mirroring the frame (the HBP column
 * on the left edge, HFP+HSYNC on the right). A "frame start" marker
 * annotates the origin corner. (The H structure repeats on every line
 * and is drawn within the active band.)
 *
 * EDID DTD naming: front porches are the sync offsets; back porches are
 * derived (blanking − sync offset − sync width); HBLANK = HFP+HSYNC+HBP and
 * HTOTAL = HACTIVE+HBLANK (same vertically).
 *
 * Annotations are drawn CAD-callout style: the numbers sit in aligned
 * stacks that track their bands (V blanking at the top-left with the
 * V fp · sync pair pushed down to the bottom-left — those bands follow
 * the active lines; H blanking at the left below the frame with the
 * H fp · sync pair pushed right — same split, each axis along its own
 * direction), each joined to the exact region it measures by a leader:
 * a short axis-aligned arm out of a dot on the frame edge, then a
 * straight run to the label (V leaders land on the frame's left edge at
 * each band's center; H leaders on the bottom edge at each column's
 * center). Each segment
 * carries one color through label, leader, dot, and frame band — front
 * porch, sync, and back porch in strong categorical hues (blue, orange,
 * aqua), one per segment class and shared by both axes —
 * so the label-to-region relationship reads at a glance regardless of how
 * thin the segments are drawn. The rails carry one callout per blanking
 * element — fp, sync, and the encodable blanking field itself: the
 * blanking number is anchored on the back-porch band (the interval's
 * visible remainder, bp = blanking − fp − sync), so every number shown is
 * a DTD field and no total sits beside its parts. Active H×V sit in the
 * center of
 * the active area; H/V totals on the outer axes. Editable numbers follow
 * the shared mode policy ({@link isTimingFieldEditable}); commits clamp
 * through {@link clampTimingField} and emit the same dotted-path contract
 * as DetailedTimingFields so the card's existing update path re-encodes.
 * Locked callouts are dimmed (digits, leader, and dot alike).
 *
 * Scale honesty: blanking bands narrower than MIN_GUTTER of the frame are
 * nudged up to stay visible (segment proportions preserved, scaled with the
 * band); the drawn aspect ratio is clamped to ASPECT_MAX in either
 * direction. A "not to scale" marker shows when the clamp meaningfully
 * distorts (hairline gutters or extreme aspect). A DTD with no geometry yet
 * renders a placeholder outline instead of popping in once values arrive.
 */
const props = withDefaults(defineProps<{
  timing: DetailedTiming
  /** Authoring mode; drives the shared editability policy. */
  mode?: TimingEditorMode
}>(), { mode: 'custom' })

const emit = defineEmits<{
  update: [field: string, value: unknown]
}>()

/** Beyond this drawn aspect ratio (w/h) the frame is clamped and flagged. */
const ASPECT_MAX = 3.2
/** Minimum drawn blanking band (fraction of the frame axis) to stay visible. */
const MIN_GUTTER = 0.05
/** Below this raw band fraction the clamp is flagged as "not to scale". */
const HAIRLINE = 0.01

/** Display fractions used by the frame's grid tracks and strips. */
interface RasterGeometry {
  hTotal: number
  vTotal: number
  hActive: number
  vActive: number
  hBlank: number
  vBlank: number
  hBorder: number
  vBorder: number
  /** Front porches / sync widths (raw field values) and derived back porches. */
  hfp: number
  hsync: number
  hbp: number
  vfp: number
  vsync: number
  vbp: number
  /** Drawn frame aspect ratio (w/h), possibly clamped. */
  aspect: number
  /** Active-area fractions of the frame axes (1 − blanking band). */
  activeW: number
  activeH: number
  /** H line segments as frame-width fractions (bump-scaled):
   *  HBP → [active] → HFP → HSync. */
  hfpF: number
  hsyncF: number
  hbpF: number
  /** V blanking segments as frame-height fractions (bump-scaled):
   *  VBP → [active] → VFP → VSync. */
  vfpF: number
  vsyncF: number
  vbpF: number
  notToScale: boolean
}

const geom = computed<RasterGeometry | null>(() => {
  const t = props.timing
  const hActive = Math.round(t.horizontalActive)
  const hBlank = Math.round(t.horizontalBlanking)
  const vActive = Math.round(t.verticalActive)
  const vBlank = Math.round(t.verticalBlanking)
  const hTotal = hActive + hBlank
  const vTotal = vActive + vBlank
  if (hTotal <= 0 || vTotal <= 0) return null

  const hfp = Math.round(t.horizontalSyncOffset)
  const hsync = Math.round(t.horizontalSyncWidth)
  const hbp = Math.max(0, hBlank - hfp - hsync)
  const vfp = Math.round(t.verticalSyncOffset)
  const vsync = Math.round(t.verticalSyncWidth)
  const vbp = Math.max(0, vBlank - vfp - vsync)

  let notToScale = false

  // Drawn aspect — clamped for extreme shapes (e.g. 4095×63).
  const rawAspect = hTotal / vTotal
  let aspect = rawAspect
  if (rawAspect > ASPECT_MAX || rawAspect < 1 / ASPECT_MAX) {
    aspect = Math.min(ASPECT_MAX, Math.max(1 / ASPECT_MAX, rawAspect))
    notToScale = true
  }

  // Blanking band fractions — zero blanking stays zero, nonzero-but-hairline
  // bands are nudged up to stay visible.
  const bandFrac = (blank: number, total: number): number => {
    if (blank <= 0) return 0
    const raw = blank / total
    if (raw >= MIN_GUTTER) return raw
    if (raw < HAIRLINE) notToScale = true
    return MIN_GUTTER
  }
  const blankW = bandFrac(hBlank, hTotal)
  const blankH = bandFrac(vBlank, vTotal)
  const activeW = 1 - blankW
  const activeH = 1 - blankH

  // Blanking segments as frame fractions. The band bump scales segments up
  // with the band; a degenerate timing whose offset+width exceed the
  // blanking interval is normalized back down into it (back porch clamped
  // at 0 by the max() above).
  const segmentFractions = (
    blank: number, total: number, fp: number, sync: number, bp: number, blankFrac: number,
  ) => {
    if (blank <= 0) return { fpF: 0, syncF: 0, bpF: 0 }
    const sum = fp + sync + bp
    const norm = sum > 0 && sum !== blank ? blank / sum : 1
    const bump = (blankFrac * total) / blank
    return {
      fpF: (fp / total) * norm * bump,
      syncF: (sync / total) * norm * bump,
      bpF: (bp / total) * norm * bump,
    }
  }
  const h = segmentFractions(hBlank, hTotal, hfp, hsync, hbp, blankW)
  const v = segmentFractions(vBlank, vTotal, vfp, vsync, vbp, blankH)

  return {
    hTotal, vTotal, hActive, vActive, hBlank, vBlank,
    hBorder: Math.round(t.horizontalBorder),
    vBorder: Math.round(t.verticalBorder),
    hfp, hsync, hbp, vfp, vsync, vbp,
    aspect, activeW, activeH,
    hfpF: h.fpF, hsyncF: h.syncF, hbpF: h.bpF,
    vfpF: v.fpF, vsyncF: v.syncF, vbpF: v.bpF,
    notToScale,
  }
})

/** Format a fraction (0..1) as a CSS percentage string. */
function pct(f: number): string {
  return `${(f * 100).toFixed(3)}%`
}

/** Mode-aware editability for a DTD field (shared policy). */
function editable(field: TimingFieldMaxKey): boolean {
  return isTimingFieldEditable(props.mode, field)
}

/** Clamp via the shared field-max table and forward to the owning card. */
function commit(field: TimingFieldMaxKey, value: number): void {
  emit('update', field, clampTimingField(field, value))
}

const refresh = computed(() => {
  if (!geom.value) return 0
  const rate = computeRefreshRate(props.timing)
  return Number.isFinite(rate) ? Math.round(rate * 100) / 100 : 0
})

/** Border band width as a fraction of the active area (per axis). */
function borderWFrac(g: RasterGeometry): number {
  return g.hActive > 0 ? Math.min(0.5, g.hBorder / g.hActive) : 0
}
function borderHFrac(g: RasterGeometry): number {
  return g.vActive > 0 ? Math.min(0.5, g.vBorder / g.vActive) : 0
}

/*
 * CAD-style callouts. Each segment class (front porch / sync / back porch)
 * carries one color shared by its label digits, leader line, anchor
 * dot, and frame band. The hues come from the validated strong categorical
 * palette declared as component-local `--raster-*` variables with light and
 * dark values, so they no longer ride the chart tokens. Blue carries
 * the front porch, orange the sync pulse (the star of the frame),
 * aqua the back porch. Locked (generator/VIC-owned)
 * callouts are dimmed.
 */
const SEGMENT_TONE = {
  fp: 'var(--raster-fp)',
  sync: 'var(--raster-sync)',
  bp: 'var(--raster-bp)',
} as const

/** Translucent fill for a frame band (segment tone at `pct`%). */
function tint(tone: string, pct: number): string {
  return `color-mix(in srgb, ${tone} ${pct}%, transparent)`
}

/** Callout descriptor: label id, its DTD field, tone. The blanking callouts
 *  ('vbp'/'hbp' — ids named for their back-porch anchor band) display the
 *  encodable blanking field directly; bp itself has no DTD bytes and stays
 *  a visible remainder (blanking − fp − sync), never a shown number. */
interface Callout {
  id: 'vfp' | 'vsync' | 'vbp' | 'hfp' | 'hsync' | 'hbp'
  field: TimingFieldMaxKey
  tone: string
}
const V_CALLOUTS: Callout[] = [
  { id: 'vbp', field: 'verticalBlanking', tone: SEGMENT_TONE.bp },
  { id: 'vfp', field: 'verticalSyncOffset', tone: SEGMENT_TONE.fp },
  { id: 'vsync', field: 'verticalSyncWidth', tone: SEGMENT_TONE.sync },
]
const H_CALLOUTS: Callout[] = [
  { id: 'hbp', field: 'horizontalBlanking', tone: SEGMENT_TONE.bp },
  { id: 'hfp', field: 'horizontalSyncOffset', tone: SEGMENT_TONE.fp },
  { id: 'hsync', field: 'horizontalSyncWidth', tone: SEGMENT_TONE.sync },
]
const CALLOUTS_BY_ID = new Map([...V_CALLOUTS, ...H_CALLOUTS].map((c) => [c.id, c]))

/** No blanking interval → no segment callouts (nothing to annotate). */
const vCallouts = computed<Callout[]>(() =>
  geom.value && geom.value.vBlank > 0 ? V_CALLOUTS : [])
const hCallouts = computed<Callout[]>(() =>
  geom.value && geom.value.hBlank > 0 ? H_CALLOUTS : [])

const CALLOUT_CAPTION: Record<Callout['id'], string> = {
  vfp: 'fp', vsync: 'sync', vbp: 'blanking',
  hfp: 'fp', hsync: 'sync', hbp: 'blanking',
}
const CALLOUT_HINT: Record<Callout['id'], string> = {
  vfp: 'V sync offset (front porch), lines',
  vsync: 'V sync width, lines',
  vbp: 'V blanking, lines — the bp band is its remainder (blanking − fp − sync)',
  hfp: 'H sync offset (front porch), px',
  hsync: 'H sync width, px',
  hbp: 'H blanking, px — the bp band is its remainder (blanking − fp − sync)',
}

/** Geometry value a callout displays (the blanking callouts read the
 *  encodable field; everything else is a raw DTD value from geom). */
function calloutValue(c: Callout): number {
  const g = geom.value
  if (!g) return 0
  switch (c.id) {
    case 'vfp': return g.vfp
    case 'vsync': return g.vsync
    case 'vbp': return g.vBlank
    case 'hfp': return g.hfp
    case 'hsync': return g.hsync
    case 'hbp': return g.hBlank
  }
}

function calloutEditable(c: Callout): boolean {
  return editable(c.field)
}

/** Digit color: full segment tone when editable, dimmed when locked
 *  (underlined by TimingRasterNumber only when editable, so the two read
 *  apart at a glance). */
function calloutTone(c: Callout): string {
  return calloutEditable(c) ? c.tone : tint(c.tone, 50)
}

/** Tooltip: name + unit, plus the edit/lock state so the affordance is
 *  spelled out even before the underline is noticed. */
function calloutHint(c: Callout): string {
  const base = CALLOUT_HINT[c.id]
  return calloutEditable(c)
    ? `${base} — click to edit`
    : `${base} — locked by the current mode`
}

/** Same status suffix for the frame-center numbers (real fields only). */
function frameHint(text: string, field: TimingFieldMaxKey): string {
  return editable(field) ? `${text} — click to edit` : `${text} — locked by the current mode`
}

/*
 * Leader geometry. Labels sit in aligned stacks left of / below the frame;
 * each is joined to its region by a two-segment leader: a short
 * axis-aligned arm out of the dot on the frame edge, then a straight run
 * to the label edge (engineering-drawing elbow, no curves). Because label
 * spacing doesn't depend on segment size, hairline porches stay legible.
 */
/** One leader: dot at (x1,y1) on the frame, elbow polyline to the label. */
interface Leader { id: string; x1: number; y1: number; d: string; tone: string; dim: boolean }

/** Length of the axis-aligned arm leaving the anchor dot. */
const LEADER_ARM = 10

const wrapEl = ref<HTMLElement | null>(null)
const frameEl = ref<HTMLElement | null>(null)
/** Label wrapper elements by callout id, populated via template refs. */
const labelEls = new Map<string, HTMLElement>()

/** Stable per-id function refs (re-created functions would churn the map).
 *  VNodeRef also allows component instances; these sit on plain spans. */
type LabelRefFn = (el: Element | ComponentPublicInstance | null) => void
const labelRefs = Object.fromEntries(
  ['vfp', 'vsync', 'vbp', 'hfp', 'hsync', 'hbp'].map((id) => [
    id,
    (el: Element | ComponentPublicInstance | null) => {
      if (el instanceof HTMLElement) labelEls.set(id, el)
      else labelEls.delete(id)
    },
  ]),
) as Record<string, LabelRefFn>

/** Bumped whenever the measured DOM may have moved (resize, geometry
 *  change, label mount/unmount) so the leaders computed re-measures. */
const measureTick = ref(0)

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  measureTick.value++
  resizeObserver = new ResizeObserver(() => { measureTick.value++ })
  if (wrapEl.value) resizeObserver.observe(wrapEl.value)
  if (frameEl.value) resizeObserver.observe(frameEl.value)
})
onBeforeUnmount(() => resizeObserver?.disconnect())
// Anchor fractions move one render after geom changes (grid tracks repaint).
watch(() => geom.value, () => nextTick(() => { measureTick.value++ }))

const leaders = computed<Leader[]>(() => {
  void measureTick.value
  const g = geom.value
  const wrap = wrapEl.value
  const frame = frameEl.value
  if (!g || !wrap || !frame) return []

  const wb = wrap.getBoundingClientRect()
  /** Rect relative to the wrapper (SVG coordinate space). */
  const rel = (el: HTMLElement) => {
    const b = el.getBoundingClientRect()
    return { left: b.left - wb.left, top: b.top - wb.top, width: b.width, height: b.height }
  }
  const fr = rel(frame)
  const frameBottom = fr.top + fr.height

  const out: Leader[] = []
  const push = (id: Callout['id'], x1: number, y1: number, isV: boolean) => {
    const el = labelEls.get(id)
    const c = CALLOUTS_BY_ID.get(id)
    if (!el || !c) return
    const r = rel(el)
    // V labels sit left of the frame: the leader lands on the label's right
    // edge, vertically centered. H labels sit below: it lands on the
    // label's top edge, horizontally centered. Each is a short arm out of
    // the dot (horizontal for V, vertical for H), then a straight run.
    const x2 = isV ? r.left + r.width : r.left + r.width / 2
    const y2 = isV ? r.top + r.height / 2 : r.top
    const d = isV
      ? `M ${x1} ${y1} L ${x1 - LEADER_ARM} ${y1} L ${x2} ${y2}`
      : `M ${x1} ${y1} L ${x1} ${y1 + LEADER_ARM} L ${x2} ${y2}`
    out.push({ id, x1, y1, d, tone: c.tone, dim: !calloutEditable(c) })
  }

  // V anchors — dots on the frame's left edge at each band's center, in
  // frame order VBP → active → VFP → VSYNC (the blanking straddles the
  // frame: VBP at the top, VFP+VSYNC at the bottom).
  if (g.vBlank > 0) {
    push('vbp', fr.left, fr.top + (g.vbpF / 2) * fr.height, true)
    push('vfp', fr.left, fr.top + (g.vbpF + g.activeH + g.vfpF / 2) * fr.height, true)
    push('vsync', fr.left, fr.top + (g.vbpF + g.activeH + g.vfpF + g.vsyncF / 2) * fr.height, true)
  }
  // H anchors — dots on the frame's bottom edge at each column's center
  // (column order HBP → active → HFP → HSYNC).
  if (g.hBlank > 0) {
    push('hbp', fr.left + (g.hbpF / 2) * fr.width, frameBottom, false)
    push('hfp', fr.left + (g.hbpF + g.activeW + g.hfpF / 2) * fr.width, frameBottom, false)
    push('hsync', fr.left + (g.hbpF + g.activeW + g.hfpF + g.hsyncF / 2) * fr.width, frameBottom, false)
  }
  return out
})
</script>

<template>
  <div class="timing-raster w-full pb-2">
    <!-- Placeholder: no usable geometry yet (fresh all-zero DTD). -->
    <div
      v-if="!geom"
      class="flex h-40 flex-col items-center justify-center gap-1.5 border-2 border-dashed border-border/60"
    >
      <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timing raster</p>
      <p class="text-[10px] text-muted-foreground/80">Enter H/V Active below to shape the frame</p>
    </div>

    <div
      v-else
      ref="wrapEl"
      class="relative grid gap-x-6"
      :style="{
        gridTemplateColumns: 'auto auto minmax(0, 1fr)',
        gridTemplateAreas: `\n'. . top'\n'vtotal vrail frame'\n'. . hrail'`,
      }"
    >
      <!-- Top axis: frame-start marker at the origin corner, hTotal centered
           over the frame, clock/rate/scan right. -->
      <div style="grid-area: top" class="grid grid-cols-3 items-center pb-0.5">
        <span class="text-[10px] text-muted-foreground/70">frame start ▼</span>
        <span class="text-center font-mono text-xs text-muted-foreground">↔ {{ geom.hTotal }} px total</span>
        <span
          v-if="timing.pixelClock > 0"
          class="whitespace-nowrap text-right font-mono text-xs text-muted-foreground"
        >{{ timing.pixelClock.toFixed(2) }} MHz · {{ refresh.toFixed(2) }} Hz {{ timing.flags.interlaced ? 'i' : 'p' }}</span>
      </div>

      <!-- V total: outer left axis. -->
      <div style="grid-area: vtotal" class="flex items-center justify-center">
        <span
          class="font-mono text-xs text-muted-foreground"
          style="writing-mode: vertical-rl; transform: rotate(180deg)"
        >↕ {{ geom.vTotal }} lines total</span>
      </div>

      <!-- V label stack: flush-right, tracking the bands — blanking at the
           top (its band opens the frame), fp · sync pushed to the bottom
           (their bands follow the active lines); the vertical mirror of
           the H rail's blanking-left / fp+sync-right split. Leaders
           connect each to its band. -->
      <div style="grid-area: vrail" class="flex flex-col items-end gap-2.5">
        <span
          v-for="c in vCallouts"
          :key="c.id"
          :ref="labelRefs[c.id]"
          class="flex"
          :class="{ 'mt-auto': c.id === 'vfp' }"
        >
          <TimingRasterNumber
            :value="calloutValue(c)"
            :editable="calloutEditable(c)"
            :caption="CALLOUT_CAPTION[c.id]"
            :hint="calloutHint(c)"
            :tone="calloutTone(c)"
            align="end"
            @commit="(v: number) => commit(c.field, v)"
          />
        </span>
      </div>

      <!-- The frame: time-domain layout, both axes cut at the end of the
           sync pulse. Rows: V back porch (VBP) opening the frame, active
           lines, then V front porch + V sync closing it — VBP → active →
           VFP → VSYNC. Columns (within the active band): HBP → active →
           HFP → HSYNC — the back porch opens the line and the sync pulse
           closes it, mirroring the frame. Sync strips carry the true
           positions. Square corners — pixel raster. -->
      <div
        ref="frameEl"
        class="relative grid overflow-hidden border border-border"
        :style="{
          gridArea: 'frame',
          aspectRatio: String(geom.aspect),
          gridTemplateColumns: `${pct(geom.hbpF)} ${pct(geom.activeW)} ${pct(geom.hfpF)} ${pct(geom.hsyncF)}`,
          gridTemplateRows: `${pct(geom.vbpF)} ${pct(geom.activeH)} ${pct(geom.vfpF)} ${pct(geom.vsyncF)}`,
          gridTemplateAreas: `'vbp vbp vbp vbp' 'hbp hactive hfp hsync' 'vfp vfp vfp vfp' 'vsync vsync vsync vsync'`,
        }"
      >
        <span
          v-if="geom.notToScale"
          class="absolute right-1 top-1 z-20 text-[9px] italic text-muted-foreground/70"
        >not to scale</span>

        <!-- V blanking: full-width rows (vertical blanking is whole
             horizontal lines), each segment in its callout tone — VBP
             opens the frame, VFP+VSYNC close it. -->
        <div :style="{ gridArea: 'vfp', background: tint(SEGMENT_TONE.fp, 25) }" />
        <div :style="{ gridArea: 'vsync', background: tint(SEGMENT_TONE.sync, 60) }" />
        <div :style="{ gridArea: 'vbp', background: tint(SEGMENT_TONE.bp, 25) }" />

        <!-- H line structure within the active band: back porch on the
             left edge, front porch + sync on the right — the blanking
             interval straddles the line origin, mirroring the frame. -->
        <div :style="{ gridArea: 'hfp', background: tint(SEGMENT_TONE.fp, 25) }" />
        <div :style="{ gridArea: 'hsync', background: tint(SEGMENT_TONE.sync, 60) }" />
        <div :style="{ gridArea: 'hbp', background: tint(SEGMENT_TONE.bp, 25) }" />

        <!-- Active area (brighter border so the picture region reads at a
             glance against the blanking gutters). -->
        <div style="grid-area: hactive" class="relative border border-primary/60 bg-primary/10">
          <!-- Border bands (H border as left/right columns, V border as
               top/bottom rows of the active area). -->
          <template v-if="geom.hBorder > 0">
            <div class="absolute inset-y-0 left-0 bg-foreground/10" :style="{ width: pct(borderWFrac(geom)) }" />
            <div class="absolute inset-y-0 right-0 bg-foreground/10" :style="{ width: pct(borderWFrac(geom)) }" />
          </template>
          <template v-if="geom.vBorder > 0">
            <div class="absolute inset-x-0 top-0 bg-foreground/10" :style="{ height: pct(borderHFrac(geom)) }" />
            <div class="absolute inset-x-0 bottom-0 bg-foreground/10" :style="{ height: pct(borderHFrac(geom)) }" />
          </template>

          <!-- Center: active H×V numbers (+ borders when present). -->
          <div class="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
            <div class="flex items-center gap-1.5">
              <TimingRasterNumber
                :value="geom.hActive"
                :editable="editable('horizontalActive')"
                caption="px"
                :hint="frameHint('H active, px', 'horizontalActive')"
                @commit="(v) => commit('horizontalActive', v)"
              />
              <span class="text-xs text-muted-foreground">×</span>
              <TimingRasterNumber
                :value="geom.vActive"
                :editable="editable('verticalActive')"
                caption="ln"
                :hint="frameHint('V active, lines', 'verticalActive')"
                @commit="(v) => commit('verticalActive', v)"
              />
            </div>
            <span class="text-[10px] uppercase tracking-wide text-muted-foreground/70">active</span>
            <div v-if="geom.hBorder > 0 || geom.vBorder > 0" class="mt-0.5 flex items-center gap-1.5">
              <span class="text-[10px] uppercase tracking-wide text-muted-foreground/70">border</span>
              <TimingRasterNumber
                v-if="geom.hBorder > 0"
                :value="geom.hBorder"
                :editable="editable('horizontalBorder')"
                caption="px"
                :hint="frameHint('H border, px', 'horizontalBorder')"
                @commit="(v) => commit('horizontalBorder', v)"
              />
              <TimingRasterNumber
                v-if="geom.vBorder > 0"
                :value="geom.vBorder"
                :editable="editable('verticalBorder')"
                caption="ln"
                :hint="frameHint('V border, lines', 'verticalBorder')"
                @commit="(v) => commit('verticalBorder', v)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- H label row: callouts in column order — blanking under the bp
           column on the left, fp · sync pushed right to theirs. Leaders
           connect each to its column. -->
      <div style="grid-area: hrail" class="flex items-start gap-6 pt-6">
        <span
          v-for="c in hCallouts"
          :key="c.id"
          :ref="labelRefs[c.id]"
          class="flex"
          :class="{ 'ml-auto': c.id === 'hfp' }"
        >
          <TimingRasterNumber
            :value="calloutValue(c)"
            :editable="calloutEditable(c)"
            :caption="CALLOUT_CAPTION[c.id]"
            :hint="calloutHint(c)"
            :tone="calloutTone(c)"
            @commit="(v: number) => commit(c.field, v)"
          />
        </span>
      </div>

      <!-- Leaders: dot on the frame edge at each region's center, a short
           arm easing into a bezier out to the label — in the callout's
           segment tone (dimmed for locked/derived). Non-interactive. -->
      <svg class="pointer-events-none absolute inset-0 z-10 h-full w-full" aria-hidden="true">
        <g fill="none" stroke-width="1">
          <path
            v-for="l in leaders"
            :key="l.id"
            :d="l.d"
            :stroke="l.tone"
            :stroke-opacity="l.dim ? 0.4 : 0.75"
          />
        </g>
        <circle
          v-for="l in leaders"
          :key="`${l.id}-dot`"
          :cx="l.x1"
          :cy="l.y1"
          r="2"
          :fill="l.tone"
          :fill-opacity="l.dim ? 0.5 : 0.9"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
/* Segment palette — strong categorical hues (user preference over the
   earlier muted cool blues): blue carries the front porch, orange the
   sync pulse, aqua the back porch / blanking callout — one hue per
   segment class, shared by the H and V axes so the same segment reads
   the same color everywhere. The three slots are the first three of the
   dataviz reference categorical palette, validated all-pairs against
   this app's surfaces (#ffffff light, ~#0a0a0a dark) in both modes
   (worst CVD pair ΔE 9.2 light / 9.4 dark); the light aqua sits just
   under 3:1 contrast, covered by the direct callout labels + Table view
   (relief rule). Declared locally so the diagram owns its hues instead
   of riding the chart tokens; the dark values are the same hues stepped
   for the dark surface. */
.timing-raster {
  --raster-fp: #2a78d6; /* blue — front porch */
  --raster-sync: #eb6834; /* orange — the sync pulse */
  --raster-bp: #1baf7a; /* aqua — back porch (blanking callout) */
}
:global(.dark) .timing-raster {
  --raster-fp: #3987e5;
  --raster-sync: #d95926;
  --raster-bp: #199e70;
}
</style>