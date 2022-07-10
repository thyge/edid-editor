<script>
export default {
    props: {
        mEdid: Object
    },
    methods: {
        uploadFile: function(e) {
            let file = e.target.files[0];
            this.$emit('ParseEEDID', file)
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