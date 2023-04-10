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
<div class="container" v-for="db in datablocks" :key="db.id">
  <div class="container dd" v-if="db.Header.Type === 'DBAudioDataBlock'">
    <label>Audio Data Block</label>
    
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
    </table>
    
    <table>
      <thead>
        <tr>
          <th>Sampling Rate</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>192Khz</td>
          <td><input type="checkbox" v-model="db.Content.Sampling192" disabled/></td>
        </tr>
        <tr>
          <td>176Khz</td>
          <td><input type="checkbox" v-model="db.Content.Sampling176" disabled/></td>
        </tr>
        <tr>
          <td>96Khz</td>
          <td><input type="checkbox" v-model="db.Content.Sampling96" disabled/></td>
        </tr>
        <tr>
          <td>88Khz</td>
          <td><input type="checkbox" v-model="db.Content.Sampling88" disabled/></td>
        </tr>
        <tr>
          <td>48Khz</td>
          <td><input type="checkbox" v-model="db.Content.Sampling48" disabled/></td>
        </tr>
        <tr>
          <td>44.1Khz</td>
          <td><input type="checkbox" v-model="db.Content.Sampling44_1" disabled/></td>
        </tr>
        <tr>
          <td>32Khz</td>
          <td><input type="checkbox" v-model="db.Content.Sampling32" disabled/></td>
        </tr>
      </tbody>
    </table>
      
    <table>
      <thead>
        <tr>
          <th>BitDepth</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>16</td>
          <td><input type="checkbox" v-model="db.Content.BitDepth16" disabled/></td>
        </tr>
        <tr>
          <td>20</td>
          <td><input type="checkbox" v-model="db.Content.BitDepth20" disabled/></td>
        </tr>
        <tr>
          <td>24</td>
          <td><input type="checkbox" v-model="db.Content.BitDepth24" disabled/></td>
        </tr>
      </tbody>
    </table>

    <button @click="RemoveElement(db.id)">remove</button>
  </div>
  <div class="container dd" v-else-if="db.Header.Type === 'DBVideoDataBlock'">
    <label>Video Data Blocks</label>
    <VideoDataBlock :m_vics="db.Content.VICs"/>
  </div>
  <div class="container dd" v-else-if="db.Header.Type === 'DBVendorSpecificDataBlock'">
    <VSDBView :m_datablock="db.Content"/>
  </div>
  <div class="container dd" v-else-if="db.Header.Type === 'DBSpeakerAllocationData'">
    <label>Speaker Allocation Data Block</label>
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
  <div class="container dd" v-else-if="db.Header.Type === 'DBUseExtendedTag'">
    <CEAExtendedTagView :m_datablock="db.Content"/>
  </div>
  <div class="container dd" v-else-if="db.Header.Type === 'DetailedTimingDescriptor'">
    <DetailedTimingView :dtd="db.Content"></DetailedTimingView>
  </div>
  <div class="container" v-else>
    <h4>{{db.Header.Type}}</h4>
    {{db.Content}}
  </div>
</div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0; 
}
.dd {
  border-style: solid;
  margin: 1rem;
  padding: 1rem;
  width: 50%;
}
</style>