<script>
export default {
  props: {
    mEdid: Object,
  },
  emits: ["upload"],
  data() {
    var sl = []
    if (document.cookie.length > 0) {
      document.cookie.split(";").forEach(s => {
        let slotsplit = s.split("=")
        let namesplit = slotsplit[1].split(",")
        sl.push({
          Slot: parseInt(slotsplit[0]),
          EDID: namesplit[0],
          Name: namesplit[1],
        })
      })
    }
    return {
      slots: sl,
      selectedSlot: 1,
    }
  },
  methods: {
    SetCookie() {
      let monitorName = ""
      this.mEdid.EDID.DisplayDescriptors.forEach(dd => {
        if (dd.Type === "Display Product Name") {
          monitorName = dd.Content
        }
      })
      let hexString = this.mEdid.raw.reduce((output, elem) => 
        (output + ('0' + elem.toString(16)).slice(-2)),'');
      document.cookie = this.selectedSlot.toString() + "=" + hexString + "," + monitorName
      this.CookiesToSlots()
    },
    PrintCookies() {
      this.CookiesToSlots();
      console.log(this.slots);
    },
    CookiesToSlots() {
      this.slots = []
      document.cookie.split(";").forEach(s => {
        let slotsplit = s.split("=")
        let namesplit = slotsplit[1].split(",")
        this.slots.push({
          Slot: parseInt(slotsplit[0]),
          EDID: namesplit[0],
          Name: namesplit[1],
        })
      })
    },
    LoadFromSlot(selected) {
      this.selectedSlot = selected
      this.CookiesToSlots()
      let byts
      this.slots.forEach(s => {
        if (selected === s.Slot) {
          byts = Uint8Array.from(s.EDID.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
        }
      })
      this.$emit('upload', byts)
    }
  },
}
</script>

<template>
<div class="btncontainer">
    <button @click="LoadFromSlot(s.Slot)"
    v-for="s in slots" :key="s.Slot">
    {{s.Name}}</button>
</div>
<div class="btncontainer">
  <select  v-model.number="selectedSlot">
    <option>1</option>
    <option>2</option>
    <option>3</option>
    <option>4</option>
  </select>
  <button @click="SetCookie">Save to browser</button>
</div>
</template>

<style scoped>
.btncontainer {
  display: flex;
  background-color: gainsboro;
  margin: 5px;
  padding: 5px;
  gap: 10px;
  width: 50%;
}
</style>