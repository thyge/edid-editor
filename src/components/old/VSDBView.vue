<script>
export default {
  name: "VSDBView",
  props: {
    m_datablock: Object,
  },
  data() {
    return {
    }
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
<div v-if="datablock.ExtendedName === 'HDMI 1.4'">
<table>
  <tr>
    <td>Address</td>
    <td>{{datablock.Address}}</td>
  </tr>
  <tr>
    <td>BitDepth16</td>
    <td><input type="checkbox" v-model="datablock.BitDepth16" disabled/></td>
  </tr>
  <tr>
    <td>BitDepth12</td>
    <td><input type="checkbox" v-model="datablock.BitDepth12" disabled/></td>
  </tr>
  <tr>
    <td>BitDepth10</td>
    <td><input type="checkbox" v-model="datablock.BitDepth10" disabled/></td>
  </tr>
  <tr>
    <td>DeepColour444</td>
    <td><input type="checkbox" v-model="datablock.DeepColour444" disabled/></td>
  </tr>
  <tr>
    <td>DVIDualLinkOperation</td>
    <td><input type="checkbox" v-model="datablock.DVIDualLinkOperation" disabled/></td>
  </tr>
  <tr>
    <td>Max_TMDS_Clock</td>
    <td>{{datablock.Max_TMDS_Clock}}Mhz</td>
  </tr>
</table>
</div>
<div v-else-if="datablock.ExtendedName === 'HDMI 2.0'">
<table>
  <tr>
    <td>Max_TMDS_Frequency</td>
    <td>{{datablock.Max_TMDS_Frequency}}Mhz</td>
  </tr>
  <tr>
    <td>SCDC_Present</td>
    <td><input type="checkbox" v-model="datablock.SCDC_Present" disabled/></td>
  </tr>
  <tr>
    <td>RR_Capable</td>
    <td><input type="checkbox" v-model="datablock.RR_Capable" disabled/></td>
  </tr>
  <tr>
    <td>CCBPCI</td>
    <td><input type="checkbox" v-model="datablock.CCBPCI" disabled/></td>
  </tr>
  <tr>
    <td>LTE_340Mcsc_scramble</td>
    <td><input type="checkbox" v-model="datablock.LTE_340Mcsc_scramble" disabled/></td>
  </tr>
  <tr>
    <td>Independent_View</td>
    <td><input type="checkbox" v-model="datablock.Independent_View" disabled/></td>
  </tr>
  <tr>
    <td>Dual_View</td>
    <td><input type="checkbox" v-model="datablock.Dual_View" disabled/></td>
  </tr>
  <tr>
    <td>OSD_3D_Disparity</td>
    <td><input type="checkbox" v-model="datablock.OSD_3D_Disparity" disabled/></td>
  </tr>
  <tr>
    <td>DC_Y420_48bit</td>
    <td><input type="checkbox" v-model="datablock.DC_Y420_48bit" disabled/></td>
  </tr>
  <tr>
    <td>DC_Y420_36bit</td>
    <td><input type="checkbox" v-model="datablock.DC_Y420_36bit" disabled/></td>
  </tr>
  <tr>
    <td>DC_Y420_30bit</td>
    <td><input type="checkbox" v-model="datablock.DC_Y420_30bit" disabled/></td>
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