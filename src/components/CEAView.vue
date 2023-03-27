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
  <div class="container">
  <div class="row">
    <h4>CEA Header</h4>
  </div>
  <div class="row">
    <div class="column column-10">Version</div>
    <div class="column column-10">
      <select v-model.number="mCEA.Header.Version">
      <option>1</option>
      <option>2</option>
      <option>3</option>
      </select>
    </div>
  </div>
  <div class="row">
    <div class="column column-10">Underscan</div>
    <div class="column column-10">
      <input type=checkbox v-model="mCEA.Header.Underscan" disabled/>
    </div>
  </div>
  <div class="row" v-show="mCEA.Header.Version > 1">
    <div class="column column-10">BasicAudio</div>
    <div class="column column-10">
      <input type=checkbox v-model="mCEA.Header.BasicAudio" disabled/>
    </div>
  </div>
  <div class="row" v-show="mCEA.Header.Version > 1">
    <div class="column column-10">YCBCR444</div>
    <div class="column column-10">
      <input type=checkbox v-model="mCEA.Header.YCBCR444" disabled/>
    </div>
  </div>
  <div class="row" v-show="mCEA.Header.Version > 1">
    <div class="column column-10">YCBCR422</div>
    <div class="column column-10">
      <input type=checkbox v-model="mCEA.Header.YCBCR422" disabled/>
    </div>
  </div>
</div>
  <!-- DTD BLOCKS -->
  <CEADatablocksView :datablocks="mCEA.DataBlocks"/>
  
</template>

<style scoped>
</style>