<script setup lang="ts">
import { computed } from 'vue'
import { findHDMIBlock, findHDMIForumBlock } from 'edidts'
import type { CEAExtensionBlock } from 'edidts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const props = defineProps<{
  cea: CEAExtensionBlock
}>()

const hdmiBlock = computed(() => findHDMIBlock(props.cea))
const hdmiForumBlock = computed(() => findHDMIForumBlock(props.cea))
const hdmi = computed(() => hdmiBlock.value?.hdmi)
const forum = computed(() => hdmiForumBlock.value?.hdmiForum)

const rowClass = 'flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2'

function formatPhysAddr(addr: [number, number, number, number]): string {
  return addr.join('.')
}

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
      <CardTitle>HDMI / Vendor Specific</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6 text-sm">
      <section v-if="hdmi">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">HDMI 1.4 VSDB</h4>
        <div class="grid grid-cols-2 gap-x-6 gap-y-1">
          <div :class="rowClass">
            <span>Physical Address</span>
            <span class="font-mono">{{ formatPhysAddr(hdmi.sourcePhysicalAddress) }}</span>
          </div>
          <div :class="rowClass">
            <span>Max TMDS Clock</span>
            <span class="font-mono">{{ hdmi.maxTmdsClockMHz }} MHz</span>
          </div>
          <div :class="rowClass">
            <span>AI Support</span>
            <span :class="hdmi.supportsAI ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ hdmi.supportsAI ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>DC Y444</span>
            <span :class="hdmi.dcY444 ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ hdmi.dcY444 ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>Deep Color 30-bit</span>
            <span :class="hdmi.dc30bit ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ hdmi.dc30bit ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>Deep Color 36-bit</span>
            <span :class="hdmi.dc36bit ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ hdmi.dc36bit ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>Deep Color 48-bit</span>
            <span :class="hdmi.dc48bit ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ hdmi.dc48bit ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>
      </section>
      <p v-else class="text-muted-foreground">No HDMI 1.4 VSDB present.</p>

      <section v-if="forum">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">HDMI Forum VSDB (2.0/2.1)</h4>
        <div class="grid grid-cols-2 gap-x-6 gap-y-1">
          <div :class="rowClass">
            <span>Version</span>
            <span class="font-mono">{{ forum.version }}</span>
          </div>
          <div :class="rowClass">
            <span>Max TMDS Rate</span>
            <span class="font-mono">{{ forum.maxTmdsCharacterRate }} MHz</span>
          </div>
          <div :class="rowClass">
            <span>Max FRL Rate</span>
            <span class="font-mono text-xs">{{ frlRateLabel(forum.maxFrlRate) }}</span>
          </div>
          <div :class="rowClass">
            <span>SCDC</span>
            <span :class="forum.scdc ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ forum.scdc ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>

        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-4 mb-3">HDMI 2.1 Features</h4>
        <div class="grid grid-cols-3 gap-x-6 gap-y-1">
          <div :class="rowClass">
            <span>VRR</span>
            <span :class="forum.vrr ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ forum.vrr ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>ALLM</span>
            <span :class="forum.allm ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ forum.allm ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>DSC</span>
            <span :class="forum.dsc ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ forum.dsc ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>CinemaVRR</span>
            <span :class="forum.cnmVrr ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ forum.cnmVrr ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>FAPA</span>
            <span :class="forum.fapa ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ forum.fapa ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>FVA</span>
            <span :class="forum.fva ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ forum.fva ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>UHD 4K</span>
            <span :class="forum.uhd4k ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ forum.uhd4k ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>

        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-4 mb-3">Deep Color 4:2:0</h4>
        <div class="grid grid-cols-3 gap-x-6 gap-y-1">
          <div :class="rowClass">
            <span>30-bit</span>
            <span :class="forum.dc30bit420 ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ forum.dc30bit420 ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>36-bit</span>
            <span :class="forum.dc36bit420 ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ forum.dc36bit420 ? 'Yes' : 'No' }}
            </span>
          </div>
          <div :class="rowClass">
            <span>48-bit</span>
            <span :class="forum.dc48bit420 ? 'text-emerald-500' : 'text-muted-foreground'">
              {{ forum.dc48bit420 ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>
      </section>
    </CardContent>
  </Card>
</template>
