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
    }
  },
  methods: {
    SetCookie(selected) {
      console.log(selected);
      let monitorName = ""
      this.mEdid.EDID.DisplayDescriptors.forEach(dd => {
        if (dd.Type === "Display Product Name") {
          monitorName = dd.Content
        }
      })
      let hexString = this.mEdid.raw.reduce((output, elem) => 
        (output + ('0' + elem.toString(16)).slice(-2)),'');
      document.cookie = selected.toString() + "=" + hexString + "," + monitorName
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
        // if slotsplit does not have cookie content return
        if (slotsplit < 2) { return }
        let namesplit = slotsplit[1].split(",")
        this.slots.push({
          Slot: parseInt(slotsplit[0]),
          EDID: namesplit[0],
          Name: namesplit[1],
        })
      })
    },
    LoadFromSlot(selected) {
      this.CookiesToSlots()
      let byts
      this.slots.forEach(s => {
        if (selected === s.Slot) {
          byts = Uint8Array.from(s.EDID.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
        }
      })
      this.$emit('upload', byts)
    },
    ClearCookie(selected) {
      this.CookiesToSlots()
      this.slots.forEach(s => {
        if (selected === s.Slot) {
          document.cookie = selected.toString()+'=; Max-Age=-99999999;';
          this.CookiesToSlots()
        }
      })
    }
  },
}
</script>

<template>
<div class="container">
<div v-for="s in slots" :key="s.Slot">
  <button class="button" @click="LoadFromSlot(s.Slot)">Load {{s.Name}}</button>
  <button class="button button-outline" @click="SetCookie(s.Slot)">Update </button>
  <button class="button button-outline" @click="ClearCookie(s.Slot)">Delete</button>
</div>
<button @click="SetCookie(this.slots.length+1)">Save Current state as new EDID</button>
</div>
</template>

<style scoped>
</style>