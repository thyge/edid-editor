<script>
export default {
  props: {
    mBytes: Uint8Array
  },
  methods: {
    makeHex(mBytes) {
      return mBytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
    },
    makeHexSingle(mByte) {
      return mByte.toString(16).padStart(2, '0');
    }
  }
}
</script>

<template>
<div class="hexview">
  <div class="hexviewinner">
    <span v-for="b in mBytes.slice(0,128)" :key="b.id">
      {{makeHexSingle(b)}}
    </span>
  </div>
  <div v-if="mBytes.length > 127" class="hexviewinner">
    <span v-for="b in mBytes.slice(128,256)" :key="b.id">
      {{makeHexSingle(b)}}
    </span>
  </div>
  <div v-if="mBytes.length > 255" class="hexviewinner">
    <span v-for="b in mBytes.slice(256)" :key="b.id">
      {{makeHexSingle(b)}}
    </span>
  </div>
</div>
</template>

<style scoped>
.hexviewinner {
  border: 3px solid gray;
  flex-wrap: wrap;
  display: flex;
  gap: 5px;
  flex-direction: row;
  font-family: monospace;
  width: 165px;
  margin: 5px;
}
.hexview {
  position: fixed;
  top: 0;
  right: 0;
}
</style>