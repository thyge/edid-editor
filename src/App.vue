<script>
import LocalStorageView from "./components/LocalStorageView.vue";
import UploadFile from "./components/UploadFile.vue";
import HexView from "./components/HexView.vue";
import EDIDView from "./views/EDIDView.vue";
import CEAView from "./components/CEAView.vue";
import DisplayIDView from "./components/DisplayIDView.vue";
import {EEDID} from "./edidjs/eedid.js";

export default {
  name: 'App',
  components: {
    UploadFile,
    HexView,
    EDIDView,
    CEAView,
    DisplayIDView,
    LocalStorageView
  },
  data() {
      let eedidObject = new EEDID()
      let txtEdid = "00,FF,FF,FF,FF,FF,FF,00,34,A9,1C,D1,01,01,01,01,\
                    00,19,01,03,80,DD,7D,78,0A,06,12,AF,51,4E,AD,24,\
                    0B,4C,51,20,08,00,A9,C0,A9,40,90,40,01,01,01,01,\
                    01,01,01,01,01,01,08,E8,00,30,F2,70,5A,80,B0,58,\
                    8A,00,1C,00,74,00,00,1E,02,3A,80,18,71,38,2D,40,\
                    58,2C,45,00,1C,00,74,00,00,1E,00,00,00,FC,00,45,\
                    54,2D,4D,44,4E,48,4D,31,30,0A,20,20,00,00,00,FD,\
                    00,17,79,0F,96,3C,00,0A,20,20,20,20,20,20,01,75,\
                    02,03,41,B1,57,61,60,5F,5E,5D,66,65,64,63,62,3F,\
                    10,1F,05,14,22,21,20,04,13,02,11,01,E3,05,E0,00,\
                    6E,03,0C,00,10,00,38,3C,20,08,80,01,02,03,04,67,\
                    D8,5D,C4,01,78,80,03,E2,00,FF,E2,0F,63,E3,06,0D,\
                    01,28,3C,80,A0,70,B0,23,40,30,20,36,00,66,00,64,\
                    00,00,1A,00,00,00,00,00,00,00,00,00,00,00,00,00,\
                    00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,\
                    00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,5A"
      txtEdid = txtEdid.replaceAll(",", "")
      txtEdid = txtEdid.replaceAll(" ", "")
      let byts = Uint8Array.from(txtEdid.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
      eedidObject.ParseEEDID(byts)
      return {
        mEdid: eedidObject,
        SelectedPanel: "CEA",
        hevViewRender: true,
      }
  },
  methods: {
    ForceReRender() {
      // Vue does not support reactivity for typed arrays
      // We have to force a re-render to get a UI update
      this.hevViewRender = false;
      this.$nextTick().then(() => {
        this.hevViewRender = true;
      });
    },
    HandleUpload(edidarr) {
      this.mEdid = new EEDID()
      this.mEdid.ParseEEDID(edidarr)
      console.log(this.mEdid);
    },
    DownloadFile(byts) {
      var file = new Blob([byts], {type: 'bin'});
      var a = document.createElement("a");
      var url = URL.createObjectURL(file); 
      a.href = url;
      a.download = "test.bin";
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);  
      }, 0); 
    },
    HandleEDIDUpdate(changedEDID) {
      this.mEdid.EDID = changedEDID;
      console.log(this.mEdid)
      this.mEdid.EDID.SetManufacturerID();
      this.mEdid.EDID.LayoutDisplayDescriptors();
      this.mEdid.EDID.SetEDIDVersion();
      this.mEdid.EDID.SetSerialNumber();
      this.mEdid.EDID.SetEstablishedTimings();
      this.mEdid.EDID.SetVideoInputParameters();
      this.mEdid.EDID.SetFeatureSupport();
      this.mEdid.EDID.SetGamma();
      this.mEdid.EDID.SetSize();
      this.mEdid.EDID.SetManufactureDate();
      this.mEdid.EDID.CalcChecksum();
      this.mEdid.UpdateEEDIDRaw();
      this.ForceReRender();
    },
    HandleCEAUpdate(changedCEA) {
      this.mEdid.CEA = changedCEA;
      console.log(this.mEdid)
      this.mEdid.CEA.SetBlocks();
      this.mEdid.UpdateEEDIDRaw();
      this.ForceReRender();
    },
    HandleAddExtension(type) {
      let blank = new Uint8Array(this.mEdid.raw.length + 128)
      // Copy in exsisting data
      for (let i = 0; i < this.mEdid.raw.length; i++) {
        blank[i] = this.mEdid.raw[i]
      }
      // increment ext counter
      blank[126]++
      // Add extension header
      switch (type) {
        case "CEA":
          blank[blank.length-128] = 0x02
          break;
        case "DID":
          blank[blank.length-128] = 0x70
          break;
      }
      this.HandleUpload(blank)
    },
    HandleNewEDID() {
      this.SelectedPanel = "EDID"
      let blank = new Uint8Array(128)
      blank[8] = 0x51
      blank[9] = 0x19
      // blank[18] = 1 // version
      // blank[19] = 4 // revision
      blank[20] = 0x80 // ensure it's Digital
      blank[23] = 0x78 // 2.2 gamma
      // standard timings unused
      for (let i = 38; i < 54; i++) {
        blank[i] = 0x01
      }
      // add dummy descriptors
      for (let i = 0; i < 4; i++) {
        blank[54+3+(18*i)] =  0x10
      }
      this.HandleUpload(blank)
    }
  }
}
</script>

<template>
  <HexView v-if="hevViewRender" :mBytes="mEdid.raw"/>
  <h1>EDID Editor</h1>
  <UploadFile @ParseEEDID="HandleUpload"/>
  <button @click="DownloadFile(mEdid.raw)">Download File</button>
  <LocalStorageView :mEdid="mEdid" @Upload="HandleUpload"/>
  <div class="container">
    <div class="row">
      <button class="column column-10"  @click="HandleNewEDID()">New EDID</button>
      <button class="column column-20" @click="HandleAddExtension('CEA')">Add CEA Extension</button>
      <button class="column column-20" @click="HandleAddExtension('DID')">Add DisplayID Extension</button>
    </div>
    <div class="row">
      <button class="column column-10" v-show="mEdid.EDID" @click="SelectedPanel='EDID'">EDID</button>
      <button class="column column-10" v-show="mEdid.CEA" @click="SelectedPanel='CEA'">CEA</button>
      <button class="column column-10" v-show="mEdid.DID" @click="SelectedPanel='DID'">DisplayID</button>
    </div>
  </div>

  <main>
    <EDIDView
    @update:EDID="HandleEDIDUpdate"
    v-if="SelectedPanel==='EDID'"
    :mmEdid="mEdid.EDID"
    :extensions="mEdid.Extensions"/>
    <CEAView
    @update:CEA="HandleCEAUpdate"
    v-if="SelectedPanel==='CEA'"
    :mmCEA="mEdid.CEA"/>
    <DisplayIDView
    v-if="SelectedPanel==='DID'"/>
  </main>
  <footer>
    <div>
      <a>See source code on</a>
      <a href="https://github.com/thyge/edid-editor">
      <img href="https://github.com/thyge/edid-editor" height="20" src="@/assets/GitHub_Logo.png"/>
      </a>
    </div>
  </footer>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
