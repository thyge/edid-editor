<script>
import VideoDataBlock from './VideoDataBlock.vue'
import VSDBView from './VSDBView.vue'
import CEAExtendedTagView from './CEAExtendedTagView.vue'
export default {
  name: "CEADatablocksView",
  props: {
    datablocks: Array
  },
  components: {
    VideoDataBlock,
    VSDBView,
    CEAExtendedTagView
  }
}
</script>

<template>
<div v-for="db in datablocks" :key="db.id">
    <div v-if="db.Header.Type === 'DBVideoDataBlock'">
    <h4>Video Data Blocks</h4>
    <VideoDataBlock :m_vics="db.Content.VICs"/>
    </div>
    <div v-else-if="db.Header.Type === 'DBUseExtendedTag'">
      <CEAExtendedTagView :m_datablock="db.Content"/>
    </div>
    <div v-else-if="db.Header.Type === 'DBVendorSpecificDataBlock'">
      <VSDBView :m_datablock="db.Content"/>
    </div>
    <div v-else>
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