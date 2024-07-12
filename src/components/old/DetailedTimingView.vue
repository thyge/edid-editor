<script>
export default {
  props: {
    dtd: Object
  },
  emit: ["RemoveElement"],
  data() {
    return {
        showDetails: false,
    }
  }
}
</script>

<template>
<div class="container">
  <label>Detailed Timing Description</label>
  <button class="button button-outline" @click="showDetails = showDetails?false:true">Show Details</button>
  <table>
      <tr>
          <td>Pixel Clock</td>
          <td>{{dtd.PixelClockKHz/1000000}}Mhz</td>
      </tr>
      <tr>
          <td>Horizontal Active</td>
          <td>{{dtd.HorizontalActive}}</td>
      </tr>
      <tr v-show="showDetails">
          <td>Horizontal Blanking</td>
          <td>{{dtd.HorizontalBlanking}}</td>
      </tr>
      <tr v-show="showDetails">
          <td>Horizontal Front Porch</td>
          <td>{{dtd.HorizontalFrontPorch}}</td>
      </tr>
      <tr v-show="showDetails">
          <td>Horizontal Sync Pulse</td>
          <td>{{dtd.HorizontalSyncPulseWidth}}</td>
      </tr>
      <tr v-show="showDetails">
          <td>Horizontal Border Pixels</td>
          <td>{{dtd.HorizontalBorder}}</td>
      </tr>
      <tr>
          <td>Vertical Active</td>
          <td>{{dtd.VerticalActive}}</td>
      </tr>
      <tr>
          <td>Vertical Refresh Rate</td>
          <td>{{dtd.VerticalRefreshRate}}hz</td>
      </tr>
      <tr v-show="showDetails">
          <td>Vertical Blanking</td>
          <td>{{dtd.VerticalBlanking}}</td>
      </tr>
      <tr v-show="showDetails">
          <td>Vertical Front Porch</td>
          <td>{{dtd.VerticalFrontPorch}}</td>
      </tr>
      <tr v-show="showDetails">
          <td>Vertical Sync Pulse</td>
          <td>{{dtd.VerticalSyncPulseWidth}}</td>
      </tr>
      <tr v-show="showDetails">
          <td>Horizontal Image Size</td>
          <td>{{dtd.HorizontalImageSize}}mm</td>
      </tr>
      <tr v-show="showDetails">
          <td>Vertical Image Size</td>
          <td>{{dtd.VerticalImageSize}}mm</td>
      </tr>
      <tr v-show="showDetails">
          <td>Vertical Border Lines</td>
          <td>{{dtd.VerticalBorder}}</td>
      </tr>
      <tr v-show="showDetails">
          <td>Interlaced</td>
          <td>{{dtd.Interlaced}}</td>
      </tr>
      <tr v-show="showDetails">
          <td>Stereo Mode</td>
          <td>{{dtd.StereoMode}}</td>
      </tr>
      <tr v-show="showDetails">
          <td>Sync</td>
          <td>{{dtd.Sync}}</td>
      </tr>
      <tr v-show="showDetails">
          <td>VerticalSyncPolarity</td>
          <td>{{dtd.VerticalSyncPolarity}}</td>
      </tr>
      <tr v-show="showDetails">
          <td>HorizontalSyncPolarity</td>
          <td>{{dtd.HorizontalSyncPolarity}}</td>
      </tr>   
  </table>
</div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
}
</style>