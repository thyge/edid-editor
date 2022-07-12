<script>
import {calculate_cvt} from "../edidjs/cvtgenerator.js"
import DetailedTimingView from "./DetailedTimingView.vue"
export default {
    name: "CVTGenerator",
    props: {
        show: Boolean
    },
    components: {
      DetailedTimingView,
    },
    data() {
      return {
        horiz_pixels: 3840,
        vert_pixels: 2160,
        refresh_rate: 60,
        margins: false,
        interlaced: false,
        reduced_blanking: "cvt_rb2",
        video_optimized: false,
        cvtObj: {
          SyncMode: {
            Type: "test"
          }
        },
      }
    },
    methods: {
      calculate() {
        let calcRet = calculate_cvt(
          this.horiz_pixels,
          this.vert_pixels,
          this.refresh_rate,
          this.margins,
          this.interlaced,
          this.reduced_blanking,
          this.video_optimized
        );
        console.log(calcRet);
        this.cvtObj = calcRet;
      }
    }
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <div class="modal-header">
            CVT Generator
          </div>
          <div class="modal-body">
            <table>
              <tr>
                <td>Timing Mode</td>
                <td>
                  <select @change="calculate()" v-model="reduced_blanking">
                  <option value="cvt">CVT</option>
                  <option value="cvt_rb">CVT-RB</option>  
                  <option value="cvt_rb2">CVT-RBv2</option>
                  <option>Custom</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Horizontal Pixels</td>
                <td><input @input="calculate()" v-model="horiz_pixels"/></td>
              </tr>
              <tr>
                <td>Vertical Pixels</td>
                <td><input @input="calculate()" v-model="vert_pixels"/></td>
              </tr>
              <tr>
                <td>Refresh Rate (Hz)</td>
                <td><input @input="calculate()" v-model="refresh_rate"/></td>
              </tr>
              <tr>
                <td>Margins</td>
                <td><input @change="calculate()" type="checkbox" v-model="margins"/></td>
              </tr>
              <tr>
                <td>Interlaced</td>
                <td><input @change="calculate()" type="checkbox" v-model="interlaced"/></td>
              </tr>
              <tr>
                <td>StereoMode</td>
                <select v-model="stereo_mode">
                <option value="2w">"2-way interleaved, right image on even lines"</option>
                <option>Custom</option>
                </select>
              </tr>
            </table>
          </div>
          <DetailedTimingView :dtd="cvtObj"/>
          <div class="modal-footer">
            <button @click="calculate()">Calc</button>
            <button
                class="modal-default-button"
                @click="$emit('close')"
              >OK</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: table;
  transition: opacity 0.3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  width: 300px;
  margin: 0px auto;
  padding: 20px 30px;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
}

.modal-header h3 {
  margin-top: 0;
  color: #42b983;
}

.modal-footer {
  padding: 20px;
}

.modal-body {
  margin: 20px 0;
}

.modal-default-button {
  float: right;
}

/*
 * The following styles are auto-applied to elements with
 * transition="modal" when their visibility is toggled
 * by Vue.js.
 *
 * You can easily play with the modal transition by editing
 * these styles.
 */

.modal-enter-from {
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>