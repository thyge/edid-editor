<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ColorPointDescriptor } from 'edidts'
import type { EDIDViewModel } from '@/types/edid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEDID } from '@/composables/useEDID'

const props = defineProps<{ edid: EDIDViewModel }>()

const { edid: edidRef, edidData } = useEDID()

const chromaticity = computed(() => props.edid.colorCharacteristics)
const colorPointDescriptor = computed(() =>
  props.edid.displayDescriptors.find((d) => d.tag === 0xFB) as ColorPointDescriptor | undefined
)
const supplementalWhitePoints = computed(() => {
  const descriptor = colorPointDescriptor.value
  console.log('Supplemental white points from descriptor:', descriptor)
  if (!descriptor) return []
  return descriptor.colorPoints
    .filter((point) => Number.isFinite(point.whiteX) && Number.isFinite(point.whiteY))
    .map((point) => ({
      index: point.index,
      label: `CP${point.index}`,
      x: clamp(point.whiteX ?? 0, 0, 0.8),
      y: clamp(point.whiteY ?? 0, 0, 0.9),
      gamma: point.gamma,
    }))
    .sort((a, b) => a.index - b.index)
})

const fmt = (v?: number) => (typeof v === 'number' ? v.toFixed(4) : '—')
const fmtGamma = (gamma?: number) => (typeof gamma === 'number' ? (gamma === 0 ? 'Native' : gamma.toFixed(2)) : '—')

const showSrgb = ref(true)
const showRec601 = ref(false)
const showP3 = ref(false)
const showRec2020 = ref(false)
const showEdid = ref(true)

const W = 380
const H = 380
const pad = { top: 16, right: 16, bottom: 28, left: 36 }
const plotW = W - pad.left - pad.right
const plotH = H - pad.top - pad.bottom

const px = (x: number) => pad.left + (x / 0.8) * plotW
const py = (y: number) => pad.top + plotH - (y / 0.9) * plotH
const unpx = (svgX: number) => ((svgX - pad.left) / plotW) * 0.8
const unpy = (svgY: number) => ((pad.top + plotH - svgY) / plotH) * 0.9

// --- Drag state ---
type PointKey = 'red' | 'green' | 'blue' | 'white'
const dragging = ref<PointKey | null>(null)
const dragX = ref(0)
const dragY = ref(0)
const svgEl = ref<SVGSVGElement | null>(null)

const livePoints = computed(() => {
  const c = chromaticity.value
  const pts = {
    redX: c.redX, redY: c.redY,
    greenX: c.greenX, greenY: c.greenY,
    blueX: c.blueX, blueY: c.blueY,
    whiteX: c.whiteX, whiteY: c.whiteY,
  }
  if (dragging.value) {
    const key = dragging.value
    pts[`${key}X` as keyof typeof pts] = dragX.value
    pts[`${key}Y` as keyof typeof pts] = dragY.value
  }
  return pts
})

const edidPath = computed(() => {
  const p = livePoints.value
  return tri([p.redX, p.redY], [p.greenX, p.greenY], [p.blueX, p.blueY])
})

const edidPts = computed(() => {
  const p = livePoints.value
  return [
    { key: 'red' as PointKey, label: 'Red', x: p.redX, y: p.redY, dot: 'bg-rose-500', fill: '#f43f5e' },
    { key: 'green' as PointKey, label: 'Green', x: p.greenX, y: p.greenY, dot: 'bg-emerald-500', fill: '#10b981' },
    { key: 'blue' as PointKey, label: 'Blue', x: p.blueX, y: p.blueY, dot: 'bg-sky-600', fill: '#0284c7' },
    { key: 'white' as PointKey, label: 'White', x: p.whiteX, y: p.whiteY, dot: 'bg-white border border-slate-400', fill: '#ffffff' },
  ]
})

function svgCoords(e: MouseEvent): { x: number; y: number } | null {
  const svg = svgEl.value
  if (!svg) return null
  const pt = svg.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const svgPt = pt.matrixTransform(ctm.inverse())
  return { x: svgPt.x, y: svgPt.y }
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function onDotDown(key: PointKey, e: MouseEvent) {
  e.preventDefault()
  const p = livePoints.value
  dragging.value = key
  dragX.value = p[`${key}X` as keyof typeof p]
  dragY.value = p[`${key}Y` as keyof typeof p]
}

function onMouseMove(e: MouseEvent) {
  if (!dragging.value) return
  const coords = svgCoords(e)
  if (!coords) return
  dragX.value = clamp(unpx(coords.x), 0, 0.8)
  dragY.value = clamp(unpy(coords.y), 0, 0.9)
}

function onMouseUp() {
  if (!dragging.value) return
  const key = dragging.value
  const edid = edidRef.value
  if (edid) {
    const cc = edid.colorCharacteristics
    if (key === 'red') { cc.redX = dragX.value; cc.redY = dragY.value }
    else if (key === 'green') { cc.greenX = dragX.value; cc.greenY = dragY.value }
    else if (key === 'blue') { cc.blueX = dragX.value; cc.blueY = dragY.value }
    else if (key === 'white') { cc.whiteX = dragX.value; cc.whiteY = dragY.value }
    edid.colorCharacteristics = cc
    edidData.value = edid.encode()
  }
  dragging.value = null
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})

const locusXY: [number, number][] = [
  [0.1741,0.0050],[0.1740,0.0050],[0.1738,0.0049],[0.1736,0.0049],
  [0.1733,0.0048],[0.1730,0.0048],[0.1726,0.0048],[0.1721,0.0048],
  [0.1714,0.0051],[0.1703,0.0058],[0.1689,0.0069],[0.1669,0.0086],
  [0.1644,0.0109],[0.1611,0.0138],[0.1566,0.0177],[0.1510,0.0227],
  [0.1440,0.0297],[0.1355,0.0399],[0.1241,0.0578],[0.1096,0.0868],
  [0.0913,0.1327],[0.0687,0.2007],[0.0454,0.2950],[0.0235,0.4127],
  [0.0082,0.5384],[0.0039,0.6548],[0.0139,0.7502],[0.0389,0.8120],
  [0.0743,0.8338],[0.1142,0.8262],[0.1547,0.8059],[0.1929,0.7816],
  [0.2296,0.7543],[0.2658,0.7243],[0.3016,0.6923],[0.3373,0.6589],
  [0.3731,0.6245],[0.4087,0.5896],[0.4441,0.5547],[0.4788,0.5202],
  [0.5125,0.4866],[0.5451,0.4544],[0.5752,0.4242],[0.6029,0.3965],
  [0.6270,0.3725],[0.6482,0.3518],[0.6658,0.3440],[0.6820,0.3340],
  [0.6949,0.3270],[0.7059,0.3220],[0.7150,0.3187],[0.7222,0.3163],
  [0.7283,0.3144],[0.7334,0.3130],[0.7379,0.3121],[0.7416,0.3115],
  [0.7447,0.3110],[0.7473,0.3107],[0.7493,0.3105],[0.7508,0.3103],
]

const locusSVG = computed(() => {
  const pts = locusXY.map(([x, y]) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`)
  return `M ${pts.join(' L ')} Z`
})

const wavelengthLabels = [
  { nm: 460, xy: [0.1440, 0.0297] as [number, number], anchor: 'end' as const, dx: -6, dy: 4 },
  { nm: 480, xy: [0.0913, 0.1327] as [number, number], anchor: 'end' as const, dx: -6, dy: 0 },
  { nm: 500, xy: [0.0082, 0.5384] as [number, number], anchor: 'end' as const, dx: -6, dy: 0 },
  { nm: 520, xy: [0.0743, 0.8338] as [number, number], anchor: 'start' as const, dx: -2, dy: -6 },
  { nm: 540, xy: [0.1547, 0.8059] as [number, number], anchor: 'start' as const, dx: 2, dy: -6 },
  { nm: 560, xy: [0.2658, 0.7243] as [number, number], anchor: 'start' as const, dx: 4, dy: -4 },
  { nm: 580, xy: [0.3731, 0.6245] as [number, number], anchor: 'start' as const, dx: 5, dy: -2 },
  { nm: 600, xy: [0.4788, 0.5202] as [number, number], anchor: 'start' as const, dx: 6, dy: 0 },
  { nm: 620, xy: [0.6029, 0.3965] as [number, number], anchor: 'start' as const, dx: 6, dy: 0 },
  { nm: 700, xy: [0.7350, 0.3120] as [number, number], anchor: 'start' as const, dx: 4, dy: 14 },
]

const tri = (r: [number, number], g: [number, number], b: [number, number]) =>
  `M ${px(r[0]).toFixed(1)},${py(r[1]).toFixed(1)} L ${px(g[0]).toFixed(1)},${py(g[1]).toFixed(1)} L ${px(b[0]).toFixed(1)},${py(b[1]).toFixed(1)} Z`

const srgbPath = tri([0.64, 0.33], [0.30, 0.60], [0.15, 0.06])
const rec601Path = tri([0.63, 0.34], [0.31, 0.595], [0.155, 0.07])
const p3Path = tri([0.68, 0.32], [0.265, 0.69], [0.15, 0.06])
const rec2020Path = tri([0.708, 0.292], [0.17, 0.797], [0.131, 0.046])

const xTicks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
const yTicks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <CardTitle>Color Characteristics</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex gap-5">
        <!-- Left: color space toggles -->
        <div class="shrink-0 w-36 pt-1">
          <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overlays</span>

          <label class="flex items-center gap-2 cursor-pointer rounded px-1.5 py-1.5 mt-2 hover:bg-muted/60">
            <input type="checkbox" v-model="showRec601" class="accent-amber-500" />
            <span class="h-2 w-2 rounded-full shrink-0 bg-amber-500" />
            <span class="text-xs">Rec. 601</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer rounded px-1.5 py-1.5 hover:bg-muted/60">
            <input type="checkbox" v-model="showP3" class="accent-pink-500" />
            <span class="h-2 w-2 rounded-full shrink-0 bg-pink-500" />
            <span class="text-xs">DCI-P3</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer rounded px-1.5 py-1.5 hover:bg-muted/60">
            <input type="checkbox" v-model="showSrgb" class="accent-slate-400" />
            <span class="h-2 w-2 rounded-full shrink-0 bg-slate-400" />
            <span class="text-xs">sRGB/Rec. 709</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer rounded px-1.5 py-1.5 hover:bg-muted/60">
            <input type="checkbox" v-model="showRec2020" class="accent-cyan-500" />
            <span class="h-2 w-2 rounded-full shrink-0 bg-cyan-500" />
            <span class="text-xs">Rec. 2020</span>
          </label>

          <div class="pt-3 border-t mt-3">
            <label class="flex items-center gap-2 cursor-pointer rounded px-1.5 py-1.5 hover:bg-muted/60">
              <input type="checkbox" v-model="showEdid" class="accent-sky-500" />
              <span class="h-2 w-2 rounded-full shrink-0 bg-sky-500" />
              <span class="text-xs font-medium">EDID Gamut</span>
            </label>
          </div>
        </div>

        <!-- Middle: CIE 1931 diagram -->
        <div class="flex-1 min-w-0 flex justify-center">
          <svg ref="svgEl" :viewBox="`0 0 ${W} ${H}`" class="w-full max-w-[380px] aspect-square select-none">
            <!-- Grid -->
            <g opacity="0.25">
              <line
                v-for="t in xTicks" :key="`gx${t}`"
                :x1="px(t)" :x2="px(t)"
                :y1="py(0)" :y2="py(0.9)"
                class="stroke-foreground/30" stroke-width="0.5"
              />
              <line
                v-for="t in yTicks" :key="`gy${t}`"
                :x1="px(0)" :x2="px(0.8)"
                :y1="py(t)" :y2="py(t)"
                class="stroke-foreground/30" stroke-width="0.5"
              />
            </g>

            <!-- Tick labels -->
            <g class="fill-muted-foreground" style="font-size: 8px; font-family: ui-monospace, monospace;">
              <text
                v-for="t in xTicks" :key="`lx${t}`"
                :x="px(t)" :y="py(0) + 12"
                text-anchor="middle"
              >{{ t.toFixed(1) }}</text>
              <text
                v-for="t in yTicks" :key="`ly${t}`"
                :x="px(0) - 4" :y="py(t) + 3"
                text-anchor="end"
              >{{ t.toFixed(1) }}</text>
            </g>

            <!-- Axis titles -->
            <text :x="px(0.4)" :y="py(0) + 24" text-anchor="middle"
              class="fill-muted-foreground" style="font-size: 10px; font-weight: 500;">x</text>
            <text :x="10" :y="py(0.45)" text-anchor="middle"
              :transform="`rotate(-90,10,${py(0.45)})`"
              class="fill-muted-foreground" style="font-size: 10px; font-weight: 500;">y</text>

            <!-- Defs: clip path + gradients for horseshoe fill -->
            <defs>
              <clipPath id="locus-clip">
                <path :d="locusSVG" />
              </clipPath>
              <radialGradient id="cg-red" :cx="px(0.72)" :cy="py(0.28)" r="220" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#ef4444" stop-opacity="0.7" />
                <stop offset="50%" stop-color="#ef4444" stop-opacity="0.15" />
                <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
              </radialGradient>
              <radialGradient id="cg-green" :cx="px(0.08)" :cy="py(0.83)" r="220" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#22c55e" stop-opacity="0.7" />
                <stop offset="50%" stop-color="#22c55e" stop-opacity="0.15" />
                <stop offset="100%" stop-color="#22c55e" stop-opacity="0" />
              </radialGradient>
              <radialGradient id="cg-blue" :cx="px(0.15)" :cy="py(0.02)" r="200" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.7" />
                <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.15" />
                <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
              </radialGradient>
              <radialGradient id="cg-white" :cx="px(0.33)" :cy="py(0.33)" r="120" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45" />
                <stop offset="60%" stop-color="#ffffff" stop-opacity="0.1" />
                <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
              </radialGradient>
            </defs>

            <!-- Horseshoe colour fill -->
            <g clip-path="url(#locus-clip)" opacity="0.5">
              <rect :x="pad.left" :y="pad.top" :width="plotW" :height="plotH" fill="url(#cg-green)" />
              <rect :x="pad.left" :y="pad.top" :width="plotW" :height="plotH" fill="url(#cg-red)" />
              <rect :x="pad.left" :y="pad.top" :width="plotW" :height="plotH" fill="url(#cg-blue)" />
              <rect :x="pad.left" :y="pad.top" :width="plotW" :height="plotH" fill="url(#cg-white)" />
            </g>

            <!-- Spectral locus (horseshoe) outline -->
            <path
              :d="locusSVG"
              fill="none"
              class="stroke-foreground/50"
              stroke-width="1.4"
              stroke-linejoin="round"
            />

            <!-- Wavelength labels along locus -->
            <g class="fill-muted-foreground" style="font-size: 7px;">
              <text
                v-for="wl in wavelengthLabels" :key="wl.nm"
                :x="px(wl.xy[0]) + wl.dx"
                :y="py(wl.xy[1]) + wl.dy"
                :text-anchor="wl.anchor"
              >{{ wl.nm }}</text>
            </g>

            <!-- EDID gamut -->
            <path v-if="showEdid" :d="edidPath" stroke="#38bdf8" fill="rgba(56,189,248,0.12)" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Reference gamut overlays -->
            <path v-if="showRec601" :d="rec601Path" stroke="#f59e0b" fill="none" stroke-width="1.6" stroke-dasharray="6 3" stroke-linejoin="round" />
            <path v-if="showP3" :d="p3Path" stroke="#ec4899" fill="none" stroke-width="1.6" stroke-dasharray="6 3" stroke-linejoin="round" />
            <path v-if="showSrgb" :d="srgbPath" stroke="#94a3b8" fill="none" stroke-width="1.6" stroke-dasharray="6 3" stroke-linejoin="round" />
            <path v-if="showRec2020" :d="rec2020Path" stroke="#06b6d4" fill="none" stroke-width="1.6" stroke-dasharray="6 3" stroke-linejoin="round" />

            <!-- EDID primary dots (draggable) -->
            <template v-if="showEdid">
              <circle v-for="pt in edidPts" :key="pt.label"
                :cx="px(pt.x)" :cy="py(pt.y)"
                :r="dragging === pt.key ? 6 : (pt.key === 'white' ? 3.5 : 4.5)"
                :fill="pt.fill"
                stroke="white" stroke-width="1"
                class="cursor-grab active:cursor-grabbing"
                @mousedown="onDotDown(pt.key, $event)"
              />
            </template>

            <!-- Supplemental white points -->
            <g v-if="supplementalWhitePoints.length">
              <g v-for="cp in supplementalWhitePoints" :key="cp.index">
                <circle
                  :cx="px(cp.x)"
                  :cy="py(cp.y)"
                  r="5"
                  fill="rgba(250,204,21,0.9)"
                  stroke="#92400e"
                  stroke-width="1"
                >
                  <title>{{ `CP${cp.index} · γ ${fmtGamma(cp.gamma)}` }}</title>
                </circle>
                <text
                  :x="px(cp.x) + 8"
                  :y="py(cp.y) - 6"
                  class="fill-foreground"
                  style="font-size: 9px; font-weight: 600;"
                >
                  {{ `CP${cp.index}` }}
                </text>
              </g>
            </g>
          </svg>
        </div>

        <!-- Right: data table -->
        <div class="shrink-0 w-48 pt-1">
          <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Chromaticity</span>
          <table class="w-full text-xs mt-2">
            <thead>
              <tr class="text-muted-foreground border-b">
                <th class="py-1.5 text-left font-medium">Point</th>
                <th class="py-1.5 text-right font-medium">x</th>
                <th class="py-1.5 text-right font-medium">y</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pt in edidPts" :key="pt.label" class="border-b last:border-b-0">
                <td class="py-1.5">
                  <span class="flex items-center gap-1.5">
                    <span class="h-2 w-2 rounded-full shrink-0" :class="pt.dot" />
                    <span class="font-medium">{{ pt.label }}</span>
                  </span>
                </td>
                <td class="py-1.5 text-right font-mono">{{ fmt(pt.x) }}</td>
                <td class="py-1.5 text-right font-mono">{{ fmt(pt.y) }}</td>
              </tr>
            </tbody>
          </table>

          <div class="mt-3 pt-2 border-t space-y-1.5 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">White Pt</span>
              <span class="font-mono">{{ chromaticity.whitePointDescription }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Area</span>
              <span class="font-mono">{{ chromaticity.gamutArea.toFixed(4) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">≈ sRGB</span>
              <span class="font-mono">{{ chromaticity.coversApproximateSRGB ? 'Yes' : 'No' }}</span>
            </div>
          </div>

          <div v-if="supplementalWhitePoints.length" class="mt-4 pt-3 border-t">
            <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Supplemental White Points</span>
            <table class="w-full text-xs mt-2">
              <thead>
                <tr class="text-muted-foreground border-b">
                  <th class="py-1.5 text-left font-medium">Index</th>
                  <th class="py-1.5 text-right font-medium">x</th>
                  <th class="py-1.5 text-right font-medium">y</th>
                  <th class="py-1.5 text-right font-medium">γ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cp in supplementalWhitePoints" :key="`table-${cp.index}`" class="border-b last:border-b-0">
                  <td class="py-1.5 font-mono">CP{{ cp.index }}</td>
                  <td class="py-1.5 text-right font-mono">{{ fmt(cp.x) }}</td>
                  <td class="py-1.5 text-right font-mono">{{ fmt(cp.y) }}</td>
                  <td class="py-1.5 text-right font-mono">{{ fmtGamma(cp.gamma) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
