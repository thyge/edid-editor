<script>
import {ASCIIDescriptor, DisplayDescriptor, DD_SerialNumber,
        DD_UnspecifiedText, DD_DisplayProductName} from "../edidjs/18ByteDescriptors.js"
export default {
  name: "EDIDCreateDisplayDescriptor",
  emits: ["close", "newdd"],
  props: {
        show: Boolean
    },
  data() {
    let dd = new ASCIIDescriptor()
    dd.Type = "Display serial number (ASCII text)"
    dd.mType = DD_SerialNumber
    dd.Content = ""
    return {
      sd: "Serial Number",
      ddObj: dd,
      ascii: "",
    }
  },
  methods: {
    UpdateDD() {
      switch (this.sd) {
        case "Serial Number":
          this.ddObj = new ASCIIDescriptor()
          this.ddObj.Type = "Display serial number (ASCII text)"
          this.ddObj.mType = DD_SerialNumber
          this.ddObj.Content = this.ascii
          break;
        case "Unspecified Text":
          this.ddObj = new ASCIIDescriptor()
          this.ddObj.Type = "Unspecified text (ASCII text)"
          this.ddObj.mType = DD_UnspecifiedText
          this.ddObj.Content = this.ascii
          break;
        case "Display Product Name":
          this.ddObj = new ASCIIDescriptor()
          this.ddObj.Type = "Display Product Name"
          this.ddObj.mType = DD_DisplayProductName
          this.ddObj.Content = this.ascii  
          break;
        case "Display Range Limits":
          this.ddObj = new DisplayDescriptor()
          break;
      }
      console.log(this.ddObj);
    }
  },
}
</script>

<template>
<Transition name="modal">
  <div v-if="show" class="modal-mask">
    <div class="modal-wrapper">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Display Descriptor</h3>
        </div>
        <div class="modal-body">
          <select @change="UpdateDD" v-model="sd">
          <option>Serial Number</option>
          <option>Unspecified Text</option>
          <!-- <option>Display Range Limits</option> -->
          <option>Display Product Name</option>
          </select>
        </div>
        <div v-if="sd != 'Display Range Limits'">
          <input @input="UpdateDD"
            type="text"
            maxlength="13"
            size="15"
            v-model="ascii"/>
        </div>
        <div class="modal-footer">
          <button @click="$emit('close')">Cancel</button>
          <button
              class="modal-default-button"
              @click="$emit('newdd',ddObj);$emit('close')">
              Add</button>
        </div>
      </div>
    </div>
  </div>
</Transition>
</template>

<style scoped>
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
  width: 400px;
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