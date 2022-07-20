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
    <div v-if="db.Header.Type === 'DBAudioDataBlock'">
    <h4>Audio Data Block</h4>
    <table>
      <tr>
        <td>Type</td>
        <select v-model="db.Content.AudioType">
          <option>LPCM</option>
        </select>
      </tr>
      <tr>
        <td>Channels</td>
        <td><input type="number" v-model="db.Content.Channels" disabled/></td>
      </tr>
      <tr>
        <td>Sampling192</td>
        <td><input type="checkbox" v-model="db.Content.Sampling192" disabled/></td>
      </tr>
      <tr>
        <td>Sampling176</td>
        <td><input type="checkbox" v-model="db.Content.Sampling176" disabled/></td>
      </tr>
      <tr>
        <td>Sampling96</td>
        <td><input type="checkbox" v-model="db.Content.Sampling96" disabled/></td>
      </tr>
      <tr>
        <td>Sampling88</td>
        <td><input type="checkbox" v-model="db.Content.Sampling88" disabled/></td>
      </tr>
      <tr>
        <td>Sampling48</td>
        <td><input type="checkbox" v-model="db.Content.Sampling48" disabled/></td>
      </tr>
      <tr>
        <td>Sampling44_1</td>
        <td><input type="checkbox" v-model="db.Content.Sampling44_1" disabled/></td>
      </tr>
      <tr>
        <td>Sampling32</td>
        <td><input type="checkbox" v-model="db.Content.Sampling32" disabled/></td>
      </tr>
      <tr>
        <td>BitDepth16</td>
        <td><input type="checkbox" v-model="db.Content.BitDepth16" disabled/></td>
      </tr>
      <tr>
        <td>BitDepth20</td>
        <td><input type="checkbox" v-model="db.Content.BitDepth20" disabled/></td>
      </tr>
      <tr>
        <td>BitDepth24</td>
        <td><input type="checkbox" v-model="db.Content.BitDepth24" disabled/></td>
      </tr>
    </table>
    </div>
    <div v-else-if="db.Header.Type === 'DBVideoDataBlock'">
    <h4>Video Data Blocks</h4>
    <VideoDataBlock :m_vics="db.Content.VICs"/>
    </div>
    <div v-else-if="db.Header.Type === 'DBVendorSpecificDataBlock'">
      <VSDBView :m_datablock="db.Content"/>
    </div>
    <div v-else-if="db.Header.Type === 'DBSpeakerAllocationData'">
      <h4>Speaker Allocation Data Block</h4>
      <table>
        <tr>
          <td>RearLeftRightCenter</td>
          <td><input type="checkbox" v-model="db.Content.RearLeftRightCenter" disabled/></td>
        </tr>
        <tr>
          <td>RearCenter</td>
          <td><input type="checkbox" v-model="db.Content.RearCenter" disabled/></td>
        </tr>
        <tr>
          <td>RearLeftRight</td>
          <td><input type="checkbox" v-model="db.Content.RearLeftRight" disabled/></td>
        </tr>
        <tr>
          <td>FrontCenter</td>
          <td><input type="checkbox" v-model="db.Content.FrontCenter" disabled/></td>
        </tr>
        <tr>
          <td>LFE</td>
          <td><input type="checkbox" v-model="db.Content.LFE" disabled/></td>
        </tr>
        <tr>
          <td>FrontLeftRight</td>
          <td><input type="checkbox" v-model="db.Content.FrontLeftRight" disabled/></td>
        </tr>
      </table>
    </div>
    <div v-else-if="db.Header.Type === 'DBUseExtendedTag'">
      <CEAExtendedTagView :m_datablock="db.Content"/>
    </div>
    <div v-else>
      <h4>{{db.Header.Type}}</h4>
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