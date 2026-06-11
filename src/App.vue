<template>
  <div class="app-root">
    <InputView v-if="!baziData" @submit="onSubmit" />
    <BaziView v-else :data="baziData" :form="formData" @back="baziData = null" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import InputView from './views/InputView.vue'
import BaziView from './views/BaziView.vue'

const baziData = ref(null)
const formData = ref(null)

function onSubmit({ data, form }) {
  baziData.value = data
  formData.value = form
}
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
  background: #f5efe4;
}
.app-root { min-height: 100vh; }
</style>
