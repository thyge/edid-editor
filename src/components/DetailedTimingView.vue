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
    <button @click="showDetails = showDetails?false:true">Show Details</button>
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
            <td>Sync Mode</td>
            <td>{{dtd.SyncMode.Type}}</td>
        </tr>
    </table>
</template>

<style scoped>
table, th, td {
  border: 1px solid;
  border-collapse: collapse;
}
</style>