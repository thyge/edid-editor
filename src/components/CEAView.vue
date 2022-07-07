<script>
import DetailedTimingView from "./DetailedTimingView.vue"
import CEADatablocksView from "./CEADatablocksView.vue"
export default {
  name: "CEAView",
  emits: ['update:CEA'],
  components: {
    DetailedTimingView,
    CEADatablocksView,
  },
  props: {
    mmCEA: Object
  },
  computed: {
    mCEA: {
      get() {
        return this.mmCEA
      }
    }
  },
  methods: {
    NotifyChange() {
      this.$emit('update:CEA', this.mCEA);
    },
    RemoveElement(e) {
      console.log(e);
    },
  }
}
</script>

<template>
  <h4>CEA Header</h4>
  <table>
    <tr>
      <td>Version</td>
      <select v-model.number="mCEA.Header.Version">
      <option>1</option>
      <option>2</option>
      <option>3</option>
      </select>
    </tr>
    <tr v-show="mCEA.Header.Version > 1">
      <td>Underscan</td>
      <td><input type=checkbox v-model="mCEA.Header.Underscan" disabled/></td>
    </tr>
    <tr v-show="mCEA.Header.Version > 1">
      <td>BasicAudio</td>
      <td><input type=checkbox v-model="mCEA.Header.BasicAudio" disabled/></td>
    </tr>
    <tr v-show="mCEA.Header.Version > 1">
      <td>YCBCR444</td>
      <td><input type=checkbox v-model="mCEA.Header.YCBCR444" disabled/></td>
    </tr>
    <tr v-show="mCEA.Header.Version > 1">
      <td>YCBCR422</td>
      <td><input type=checkbox v-model="mCEA.Header.YCBCR422" disabled/></td>
    </tr>
  </table>
  <h4>Detailed Timing Descriptions</h4>
  <div v-for="dtd in mCEA.DetailedTimingBlocks" :key="dtd.id">
    <button @click="RemoveElement(dtd.Type)">remove</button>
    <DetailedTimingView :dtd="dtd"/>
  </div>
  <CEADatablocksView :datablocks="mCEA.DataBlocksCollection"/>
</template>

<style scoped>
table, th, td {
  border: 1px solid;
  border-collapse: collapse;
}
</style>