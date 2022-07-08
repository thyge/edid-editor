<script>
export default {
  name: "CEADatablocksView",
  props: {
    datablocks: Array
  },
}
</script>

<template>
<div v-for="db in datablocks" :key="db.id">
    <div v-if="db.Header.Type === 'DBVideoDataBlock'">
        <h4>Video Data Blocks</h4>
        <table>
            <tr>
                <td>Description</td>
                <td>HorizontalActive</td>
                <td>VerticalActive</td>
                <td>PixelMHz</td>
                <td>Native</td>
            </tr>
        <tr v-for="v in db.Content.VICs" :key="v.id">
            <td>{{v.Description}}</td>
            <td>{{v.HorizontalActive}}</td>
            <td>{{v.VerticalActive}}</td>
            <td>{{v.PixelMHz}}Mhz</td>
            <td><input type="checkbox" v-model="v.Native" disabled/></td>
        </tr>
        </table>
    </div>
    <div v-if="db.Header.Type === 'DBVendorSpecificDataBlock'">
      <h4>{{db.Content.ExtendedName}}</h4>
      {{db.Content}}
    </div>
</div>
</template>

<style scoped>
table, th, td {
  border: 1px solid;
  border-collapse: collapse;
}
</style>