<script>
import VideoDataBlock from './VideoDataBlock.vue'
import VSDBView from './VSDBView.vue'
import CEAExtendedTagView from './CEAExtendedTagView.vue'
import DetailedTimingView from './DetailedTimingView.vue';
export default {
  name: "CEADatablocksView",
  props: {
    datablocks: Array
  },
  components: {
    VideoDataBlock,
    VSDBView,
    CEAExtendedTagView,
    DetailedTimingView
}
}
</script>

<template>
<div v-for="db in datablocks" :key="db.id">
  <div class="container" v-if="db.Header.Type === 'DBAudioDataBlock'">
    <div class="row">
      <div class="column column-50">
        <h4>Audio Data Block</h4>
      </div>
      <div class="column">
        <button @click="RemoveElement(db.id)">remove</button>
      </div>
    </div>
    <div class="row">
      <div class="column column-10">Type</div>
      <div class="column column-20">
        <select v-model="db.Content.AudioType">
          <option>LPCM</option>
        </select>
      </div>
    </div>
    <div class="row">
      <div class="column column-10">
        Channels
      </div>
      <div class="column column-20">
        <input type="number" v-model="db.Content.Channels" disabled/>
      </div>
    </div>
    <div class="row">
      <div class="column column-40">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>192Khz</th>
              <th>176Khz</th>
              <th>96Khz</th>
              <th>88Khz</th>
              <th>48Khz</th>
              <th>44.1Khz</th>
              <th>32Khz</th>
            </tr>
          </thead>
        <tbody>
        </tbody>
          <tr>
            <td>Sampling</td>
            <td><input type="checkbox" v-model="db.Content.Sampling192" disabled/></td>
            <td><input type="checkbox" v-model="db.Content.Sampling176" disabled/></td>
            <td><input type="checkbox" v-model="db.Content.Sampling96" disabled/></td>
            <td><input type="checkbox" v-model="db.Content.Sampling88" disabled/></td>
            <td><input type="checkbox" v-model="db.Content.Sampling48" disabled/></td>
            <td><input type="checkbox" v-model="db.Content.Sampling44_1" disabled/></td>
            <td><input type="checkbox" v-model="db.Content.Sampling32" disabled/></td>
          </tr>
        </table>
      </div>
    </div>
    <div class="row">
      <div class="column column-40">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>16</th>
              <th>20</th>
              <th>24</th>
            </tr>
          </thead>
        <tbody>
        </tbody>
          <tr>
            <td>BitDepth</td>
            <td><input type="checkbox" v-model="db.Content.BitDepth16" disabled/></td>
            <td><input type="checkbox" v-model="db.Content.BitDepth20" disabled/></td>
            <td><input type="checkbox" v-model="db.Content.BitDepth24" disabled/></td>
          </tr>
        </table>
      </div>
    </div>
  </div>
  <div class="container" v-else-if="db.Header.Type === 'DBVideoDataBlock'">
    <div class="row">
      <div class="column">
        <h4>Video Data Blocks</h4>
      </div>
    </div>
    <VideoDataBlock :m_vics="db.Content.VICs"/>
  </div>
  <div class="container" v-else-if="db.Header.Type === 'DBVendorSpecificDataBlock'">
    <VSDBView :m_datablock="db.Content"/>
  </div>
  <div class="container" v-else-if="db.Header.Type === 'DBSpeakerAllocationData'">
    <div class="row">
      <div class="column">
        <h4>Speaker Allocation Data Block</h4>
      </div>
    </div>
    <div class="row">
      <div class="column column-10">
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
    </div>
  </div>
  <div class="container" v-else-if="db.Header.Type === 'DBUseExtendedTag'">
    <CEAExtendedTagView :m_datablock="db.Content"/>
  </div>
  <div v-else-if="db.Header.Type === 'DetailedTimingDescriptor'">
    <DetailedTimingView :dtd="db.Content"></DetailedTimingView>
  </div>
  <div v-else>
    <h4>{{db.Header.Type}}</h4>
    {{db.Content}}
  </div>
</div>
</template>

<style scoped>
/* table, th, td {
  border: 1px solid;
  border-collapse: collapse;
  margin: 5px;
} */
</style>