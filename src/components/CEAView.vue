<script>
import CEADatablocksView from "./CEADatablocksView.vue"
export default {
  name: "CEAView",
  emits: ['update:CEA'],
  components: {
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
      this.mCEA.DetailedTimingBlocks.forEach((d, i) => {
        if (d.id === e) {
          this.mCEA.DetailedTimingBlocks.splice(i, 1)
        }
      });
      this.$emit('update:CEA', this.mCEA);
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
  <!-- DTD BLOCKS -->
  <CEADatablocksView :datablocks="mCEA.DataBlocks"/>
</template>

<style scoped>
table, th, td {
  border: 1px solid;
  border-collapse: collapse;
}
</style>