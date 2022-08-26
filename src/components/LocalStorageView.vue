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

<div class="btncontainer">
    <div class="slotbtns" v-for="s in slots" :key="s.Slot">
      <button @click="LoadFromSlot(s.Slot)">{{s.Name}}</button>
      <button @click="SetCookie(s.Slot)">Update </button>
      <button @click="ClearCookie(s.Slot)">Delete</button>
    </div>
    <button @click="SetCookie(this.slots.length+1)">Save New EDID</button>
</div>
</template>

<style scoped>
.btncontainer {
  display: flex;
  text-align: center;
  margin: 5px;
  gap: 10px;
  width: 50%;
}
.slotbtns {
  display: flex;
  flex-direction: column;
  border-style: solid;
  border-color: gainsboro;
  padding: 5px;
}
</style>