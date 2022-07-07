<script>
import DetailedTimingView from "./DetailedTimingView.vue"
export default {
  name: "EDIDView",
  emits: ['update:EDID'],
  components: {
    DetailedTimingView,
  },
  props: {
    mmEdid: Object
  },
  computed: {
    mEdid: {
      get() {
        return this.mmEdid
      }
    }
  },
  methods: {
    NotifyChange() {
      this.$emit('update:EDID', this.mEdid)
    },
    RemoveElement(e) {
      console.log(e)
      this.mEdid.RemoveDisplayDescriptor(e);
      this.NotifyChange();
    },
  }
}
</script>

<template>
    <table>
      <tr>
        <td>Extensions</td>
        <td>{{mEdid.Extensions}}</td>
      </tr>
      <tr>
        <td>Manufacturer ID</td>
        <td><input @input="NotifyChange()" maxlength="3" size="4" v-model="mEdid.ManufacturerID" disabled/></td>
        <td>{{mEdid.GetPNPCompanyName()}}</td>
      </tr>
      <tr>
        <td>Serial Number</td>
        <td><input @input="NotifyChange()" maxlength="3" size="10" v-model="mEdid.SerialNumber"/></td>
      </tr>
      <tr v-if="true">
        <td>Product Name</td>
        <td>{{mEdid.ProductName}}</td>
        <td>Change this under Display Descriptors</td>
      </tr>
      <tr>
        <td>Date of manufacture</td>
        <td>
          Year:
          <input @input="NotifyChange()"
          maxlength="4" size="4" v-model.number="mEdid.YearOfManufacture"/>
          Week:
          <input @input="NotifyChange()"
          maxlength="2" size="2" v-model.number="mEdid.WeekOfManufacture"/>
        </td>
      </tr>
      <tr>
        <td>Version and Revision</td>
        <td>
          <select @change="NotifyChange()" v-model.number="mEdid.Revision">
            <option value="3">1.3</option>
            <option value="4">1.4</option>
          </select>
        </td>
      </tr>
    </table>
    <!-- Display Parameters -->
    <h4>Display Parameters</h4>
    <table>
      <tr>
        <td>Display Size</td>
        <td>{{mEdid.HorizontalSizeCM}}cm x {{mEdid.VerticalSizeCM}}cm</td>
      </tr>
      <tr>
        <td>Display Gamma</td>
        <td><input @input="NotifyChange()" maxlength="3" size="2" v-model.number="mEdid.Gamma"/></td>
      </tr>
      <tr>
        <td>DPMS Standby</td>
        <td><input type=checkbox v-model="mEdid.DPMSstandby" disabled/></td>
      </tr>
      <tr>
        <td>DPMS Suspend</td>
        <td><input type=checkbox v-model="mEdid.DPMSsuspend" disabled/></td>
      </tr>
      <tr>
        <td>DPMS ActiveOff</td>
        <td><input type=checkbox v-model="mEdid.DPMSactiveOff" disabled/></td>
      </tr>
      <tr>
        <td>sRGB</td>
        <td><input type=checkbox v-model="mEdid.sRGB" disabled/></td>
      </tr>
      <tr>
        <td>Preferred Timing Mode</td>
        <td><input type=checkbox v-model="mEdid.PreferredTiming" disabled/></td>
      </tr>
      <tr v-show="mEdid.Revision > 3">
        <td>Display Bitdepth</td>
        <td>
          <select v-model.number="mEdid.VideoBitDepth" disabled>
          <option>undefined</option>
          <option>6</option>
          <option>8</option>
          <option>10</option>
          <option>12</option>
          <option>16</option>
          </select>
        </td>
        <td>EDID 1.4 Only</td>
      </tr>
      <tr v-show="mEdid.Revision > 3">
        <td>Display Interface</td>
        <td>
          <select v-model.number="mEdid.VideoInterface" disabled>
          <option>undefined</option>
          <option>HDMIa</option>
          <option>HDMIb</option>
          <option>MDDI</option>
          <option>DisplayPort</option>
          </select>
        </td>
        <td>EDID 1.4 Only</td>
      </tr>
      <tr v-show="mEdid.Revision > 3">
        <td>Display Interface</td>
        <td>
          <select v-model.number="mEdid.ColourEncoding" disabled>
          <option>RGB 4:4:4</option>
          <option>RGB 4:4:4 + YCrCb 4:4:4</option>
          <option>RGB 4:4:4 + YCrCb 4:2:2</option>
          <option>RGB 4:4:4 + YCrCb 4:4:4 + YCrCb 4:2:2</option>
          </select>
        </td>
        <td>EDID 1.4 Only</td>
      </tr>
    </table>
    <h4>Chromaticity</h4>
    <table>
      <tr>
        <td></td>
        <td style="text-align:center">X</td>
        <td style="text-align:center">Y</td>
      </tr>
      <tr>
        <td>Red</td>
        <td><input v-model.number="mEdid.Chromaticity.RedX" disabled/></td>
        <td><input v-model.number="mEdid.Chromaticity.RedY" disabled/></td>
      </tr>
      <tr>
        <td>Green</td>
        <td><input v-model.number="mEdid.Chromaticity.GreenX" disabled/></td>
        <td><input v-model.number="mEdid.Chromaticity.GreenY" disabled/></td>
      </tr>
      <tr>
        <td>Blue</td>
        <td><input v-model.number="mEdid.Chromaticity.BlueX" disabled/></td>
        <td><input v-model.number="mEdid.Chromaticity.BlueY" disabled/></td>
      </tr>
      <tr>
        <td>White</td>
        <td><input v-model.number="mEdid.Chromaticity.WhiteX" disabled/></td>
        <td><input v-model.number="mEdid.Chromaticity.WhiteY" disabled/></td>
      </tr>
    </table>
    <h4>Established Timings</h4>
    <table @change="NotifyChange()" class="establishedTimingsTable">
      <tr>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET720_400_70"/>
        720x400@70</td>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET800_600_72"/>
        800x600@72</td>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET1152_870_75"/>
        1152x870@75</td>
      </tr>
      <tr>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET720_400_88"/>
        720x400@88</td>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET800_600_75"/>
        800x600@75</td>
      </tr>
      <tr>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET640_480_60"/>
        640x480@60</td>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET832_624_75"/>
        832x624@75</td>
      </tr>
      <tr>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET640_480_67"/>
        640x480@67</td>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET1024_768_87"/>
        1024x768@87</td>
      </tr>
      <tr>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET640_480_72"/>
        640x480@72</td>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET1024_768_60"/>
        1024x768@60</td>
      </tr>
      <tr>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET640_480_75"/>
        640x480@75</td>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET1024_768_70"/>
        1024x768@70</td>
      </tr>
      <tr>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET800_600_56"/>
        800x600@56</td>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET1024_768_75"/>
        1024x768@75</td>
      </tr>
      <tr>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET800_600_60"/>
        800x600@60</td>
        <td><input type="checkbox"
        v-model="mEdid.EstablishedTimings.ET1280_1024_75"/>
        1280x1024@75</td>
      </tr>
    </table>
    <h4>Standard Timings</h4>
    <button disabled>add</button>
    <table>
      <tr>
        <td>HorizontalActive</td>
        <td>AspectRatio</td>
        <td>RefreshRate</td>
      </tr>
      <tr v-for="st in mEdid.StandardTimings" :key="st.id">
        <td>{{st.HorizontalActive}}</td>
        <td>{{st.AspectRatio}}</td>
        <td>{{st.RefreshRate}}</td>
        <td><button disabled>remove</button></td>
      </tr>
    </table>
    <h4>Detailed Timing Descriptors</h4>
    <div v-for="dtd in mEdid.DetailedTimingDescriptors" :key="dtd.id">
      <button @click="RemoveElement(dtd.Type)">remove</button>
      <DetailedTimingView :dtd="dtd"/>
    </div>
    <h4>Display Descriptors</h4>
    <div v-for="dd in mEdid.DisplayDescriptors" :key="dd.id">
      <div v-if="dd.Type === 'Display Range Limits'">
        {{dd.Content}}<button @click="RemoveElement(dd.Type)">remove</button>
      </div>
      <div v-else>
        <span>{{dd.Type}}: </span>
        <span>{{dd.Content}}</span>
        <button @click="RemoveElement(dd.Type)">remove</button>
      </div>
    </div>
</template>

<style scoped>
table, th, td {
  border: 1px solid;
  border-collapse: collapse;
}
.establishedTimingsTable {
  font-size: small;
} 
</style>