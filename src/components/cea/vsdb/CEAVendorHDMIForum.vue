<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HDMIForumVSDB } from 'edidts'

defineProps<{ fields: HDMIForumVSDB }>()

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'

function frlRateLabel(rate: number): string {
  const labels: Record<number, string> = {
    0: 'None',
    1: '3 Gbps (3 lanes)',
    2: '6 Gbps (3 lanes)',
    3: '6 Gbps (4 lanes)',
    4: '8 Gbps (4 lanes)',
    5: '10 Gbps (4 lanes)',
    6: '12 Gbps (4 lanes)',
  }
  return labels[rate] ?? `Rate ${rate}`
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>HDMI Forum VSDB (2.0/2.1) <span class="text-xs text-muted-foreground font-normal">(OUI C4-5D-D8)</span></CardTitle>
    </CardHeader>
    <CardContent class="space-y-4 text-sm">
      <div class="grid grid-cols-2 gap-x-6 gap-y-1">
        <div :class="rowClass">
          <span>Version</span>
          <span class="font-mono">{{ fields.version }}</span>
        </div>
        <div :class="rowClass">
          <span>Max TMDS Rate</span>
          <span class="font-mono">{{ fields.maxTmdsCharacterRate }} MHz</span>
        </div>
        <div :class="rowClass">
          <span>Max FRL Rate</span>
          <span class="font-mono text-xs">{{ frlRateLabel(fields.maxFrlRate) }}</span>
        </div>
        <div :class="rowClass">
          <span>SCDC</span>
          <span :class="fields.scdc ? 'text-emerald-500' : 'text-muted-foreground'">
            {{ fields.scdc ? 'Yes' : 'No' }}
          </span>
        </div>
        <div :class="rowClass">
          <span>Read Request</span>
          <span :class="fields.rr ? 'text-emerald-500' : 'text-muted-foreground'">
            {{ fields.rr ? 'Yes' : 'No' }}
          </span>
        </div>
        <div :class="rowClass">
          <span>340 Mcsc Scramble</span>
          <span :class="fields.lte340McscScramble ? 'text-emerald-500' : 'text-muted-foreground'">
            {{ fields.lte340McscScramble ? 'Yes' : 'No' }}
          </span>
        </div>
        <div :class="rowClass">
          <span>Independent View</span>
          <span :class="fields.independentView ? 'text-emerald-500' : 'text-muted-foreground'">
            {{ fields.independentView ? 'Yes' : 'No' }}
          </span>
        </div>
        <div :class="rowClass">
          <span>Dual View</span>
          <span :class="fields.dualView ? 'text-emerald-500' : 'text-muted-foreground'">
            {{ fields.dualView ? 'Yes' : 'No' }}
          </span>
        </div>
        <div :class="rowClass">
          <span>OSD 3D</span>
          <span :class="fields.osd3d ? 'text-emerald-500' : 'text-muted-foreground'">
            {{ fields.osd3d ? 'Yes' : 'No' }}
          </span>
        </div>
      </div>

      <div>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">HDMI 2.1 Features</h4>
        <div class="grid grid-cols-3 gap-x-6 gap-y-1">
          <div :class="rowClass">
            <span>VRR</span>
            <span :class="fields.vrr ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ fields.vrr ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>ALLM</span>
            <span :class="fields.allm ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ fields.allm ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>DSC</span>
            <span :class="fields.dsc ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ fields.dsc ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>CinemaVRR</span>
            <span :class="fields.cnmVrr ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ fields.cnmVrr ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>FAPA</span>
            <span :class="fields.fapa ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ fields.fapa ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>FVA</span>
            <span :class="fields.fva ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ fields.fva ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>UHD 4K</span>
            <span :class="fields.uhd4k ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ fields.uhd4k ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Deep Color 4:2:0</h4>
        <div class="grid grid-cols-3 gap-x-6 gap-y-1">
          <div :class="rowClass">
            <span>30-bit</span>
            <span :class="fields.dc30bit420 ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ fields.dc30bit420 ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>36-bit</span>
            <span :class="fields.dc36bit420 ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ fields.dc36bit420 ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>48-bit</span>
            <span :class="fields.dc48bit420 ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ fields.dc48bit420 ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
