<template>
  <div class="app-root">
    <transition name="page" mode="out-in">
      <InputView v-if="!baziData" key="input" @submit="onSubmit" />
      <BaziView v-else key="bazi" :data="baziData" :form="formData" @back="onBack" />
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import InputView from './InputView.vue'
import BaziView from './BaziView.vue'

const baziData = ref(null)
const formData = ref(null)

function onSubmit({ data, form }) {
  baziData.value = data
  formData.value = form
}

function onBack() {
  baziData.value = null
}
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Noto Serif SC', 'PingFang SC', 'STSong', 'Microsoft YaHei', serif;
  background: #f5efe4;
  font-weight: 500;
}
.app-root { min-height: 100vh; }

/* 页面切换 */
.page-enter-active {
  animation: page-in 0.36s cubic-bezier(0.22, 1, 0.36, 1);
}
.page-leave-active {
  animation: page-out 0.22s cubic-bezier(0.4, 0, 1, 1);
}
@keyframes page-in {
  from { opacity: 0; transform: translateY(18px) scale(0.99); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}
@keyframes page-out {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-10px); }
}
</style>
