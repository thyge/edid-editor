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
  <span v-for="b in mBytes" :key="b.id">
    {{makeHexSingle(b)}}
  </span>
</div>
</template>

<style scoped>
.hexview {
  position: fixed;
  top: 0;
  right: 0;
  width: 165px;
  border: 3px solid gray;
  display: flex;
  flex-direction: row;
  gap: 5px;
  flex-wrap: wrap;
  font-family: monospace;
}
</style>