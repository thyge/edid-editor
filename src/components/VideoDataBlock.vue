<script>
export default {
    name: "VideoDataBlock",
    props: {
        m_vics: Array
    }
}
</script>

<template>
<table>
  <tr>
    <td>Description</td>
    <td>HorizontalActive</td>
    <td>VerticalActive</td>
    <td>PixelMHz</td>
    <td>Native</td>
  </tr>
<tr v-for="v in m_vics" :key="v.id">
  <td>{{v.Description}}</td>
  <td>{{v.HorizontalActive}}</td>
  <td>{{v.VerticalActive}}</td>
  <td>{{v.PixelMHz}}Mhz</td>
  <td><input type="checkbox" v-model="v.Native" disabled/></td>
</tr>
</table>
</template>

<style scoped>
table, th, td {
  border: 1px solid;
  border-collapse: collapse;
}
</style>