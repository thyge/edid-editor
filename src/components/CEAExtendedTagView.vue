<script>
import VideoDataBlock from './VideoDataBlock.vue'
export default {
  name: "CEAExtendedTagView",
  props: {
    m_datablock: Object,
  },
  components: {
    VideoDataBlock,
  },
  computed: {
    datablock: {
      get() {
          return this.m_datablock
      }
    }
  },
}
</script>

<template>
<h4>{{datablock.ExtendedName}}</h4>
<div v-if="datablock.ExtendedName === 'ColorimetryDB'">
<table>
  <tr>
    <td>xvYCC601</td>
    <td><input type="checkbox" v-model="datablock.xvYCC601" disabled/></td>
  </tr>
  <tr>
    <td>xvYCC709</td>
    <td><input type="checkbox" v-model="datablock.xvYCC709" disabled/></td>
  </tr>
  <tr>
    <td>sYCC601</td>
    <td><input type="checkbox" v-model="datablock.sYCC601" disabled/></td>
  </tr>
  <tr>
    <td>opYCC601</td>
    <td><input type="checkbox" v-model="datablock.opYCC601" disabled/></td>
  </tr>
  <tr>
    <td>opRGB</td>
    <td><input type="checkbox" v-model="datablock.opRGB" disabled/></td>
  </tr>
  <tr>
    <td>BT2020cYCC</td>
    <td><input type="checkbox" v-model="datablock.BT2020cYCC" disabled/></td>
  </tr>
  <tr>
    <td>BT2020YCC</td>
    <td><input type="checkbox" v-model="datablock.BT2020YCC" disabled/></td>
  </tr>
  <tr>
    <td>BT2020RGB</td>
    <td><input type="checkbox" v-model="datablock.BT2020RGB" disabled/></td>
  </tr>
  <tr>
    <td>DCIP3</td>
    <td><input type="checkbox" v-model="datablock.DCIP3" disabled/></td>
  </tr>
</table>
</div>
<div v-else-if="datablock.ExtendedName === 'VideoCapabilityDB'">
<table>
  <tr>
    <td>YCCQuantizationRangeSelectable</td>
    <td><input type="checkbox" v-model="datablock.YCCQuantizationRangeSelectable" disabled/></td>
  </tr>
  <tr>
    <td>RGBQuantizationRangeSelectable</td>
    <td><input type="checkbox" v-model="datablock.RGBQuantizationRangeSelectable" disabled/></td>
  </tr>
  <tr>
    <td>PTOverscanBehavior</td>
    <td>{{datablock.PTOverscanBehavior}}</td>
  </tr>
  <tr>
    <td>ITOverscanBehavior</td>
    <td>{{datablock.ITOverscanBehavior}}</td>
  </tr>
  <tr>
    <td>CEOverscanBehavior</td>
    <td>{{datablock.CEOverscanBehavior}}</td>
  </tr>
</table>
</div>
<div v-else-if="datablock.ExtendedName === 'YCBCR420CapabilityMap'">
  <VideoDataBlock :m_vics="datablock.VICs"/>
</div>
<div v-else-if="datablock.ExtendedName === 'HDRStaticMetadataDB'">
<table>
  <tr>
    <td>SDR</td>
    <td><input type="checkbox" v-model="datablock.SDR" disabled/></td>
  </tr>
  <tr>
    <td>HDR</td>
    <td><input type="checkbox" v-model="datablock.HDR" disabled/></td>
  </tr>
  <tr>
    <td>HLG</td>
    <td><input type="checkbox" v-model="datablock.HLG" disabled/></td>
  </tr>
  <tr>
    <td>ST2084</td>
    <td><input type="checkbox" v-model="datablock.ST2084" disabled/></td>
  </tr>
  <tr>
    <td>StaticMetadataType1</td>
    <td><input type="checkbox" v-model="datablock.StaticMetadataType1" disabled/></td>
  </tr>
</table>
</div>
<div v-else>
{{datablock}}
</div>
</template>

<style scoped>
table, th, td {
  border: 1px solid;
  border-collapse: collapse;
}
</style>