<script>
export default {
  props: {
    mEdid: Object
  },
  emits: ["ParseEEDID"],
  methods: {
    uploadFile: function(e) {
      let file = e.target.files[0];
      if ((typeof file === 'undefined') || file === null) {
        return
      }
      let reader = new FileReader();
      let vm = this
      if (file.name.split('.').pop() === "bin") {
        reader.onload = function(event) {
          let edidarr = new Uint8Array(event.target.result);
          vm.$emit('ParseEEDID', edidarr)
        }
        reader.readAsArrayBuffer(file);
      } else if (file.name.split('.').pop() === "txt") {
        reader.onload = function(event) {
          let txtEdid = event.target.result.replaceAll(",", "")
          txtEdid = txtEdid.replaceAll(" ", "")
          let edidarr = Uint8Array.from(txtEdid.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
          vm.$emit('ParseEEDID', edidarr)
        }
        reader.readAsText(file);
      }
    }
  }
}
</script>

<template>
    <input @change="uploadFile" type="file" accept=".bin, .txt" enctype="multipart/form-data" />
</template>

<style scoped>
input {
    margin: 10px;
}
</style>