<template>
  <van-overlay :show="visible" z-index="2000" @click.stop>
    <div class="cropper-wrap" @click.stop>
      <div class="cropper-title">裁切图片（1:1）</div>
      <div class="cropper-box">
        <img ref="imgRef" :src="imgSrc" style="max-width:100%;display:block;" />
      </div>
      <div class="cropper-actions">
        <button @click="emit('cancel')">取消</button>
        <button class="btn-confirm" @click="doCrop">确认裁切</button>
      </div>
    </div>
  </van-overlay>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

const props = defineProps({
  imgSrc: { type: String, default: '' },
  visible: { type: Boolean, default: false }
})
const emit = defineEmits(['confirm', 'cancel'])
const imgRef = ref(null)
let cropper = null

watch(() => props.visible, async (v) => {
  if (v) {
    await nextTick()
    if (cropper) cropper.destroy()
    cropper = new Cropper(imgRef.value, {
      aspectRatio: 1,
      viewMode: 1,
      autoCropArea: 0.8,
    })
  } else {
    if (cropper) {
      cropper.destroy()
      cropper = null
    }
  }
})

function doCrop() {
  if (!cropper) return
  const canvas = cropper.getCroppedCanvas({ width: 800, height: 800 })
  canvas.toBlob(blob => emit('confirm', blob), 'image/jpeg', 0.9)
}

onUnmounted(() => {
  if (cropper) cropper.destroy()
})
</script>

<style scoped>
.cropper-wrap {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin: 20px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.cropper-title {
  font-size: 16px;
  font-weight: 700;
  color: #e91e8c;
  text-align: center;
  margin-bottom: 12px;
}

.cropper-box {
  flex: 1;
  overflow: hidden;
  border-radius: 8px;
  max-height: 60vh;
}

.cropper-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.cropper-actions button {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  background: #f5f5f5;
  color: #666;
}

.btn-confirm {
  background: linear-gradient(135deg, #ff6b9d, #ff9a9e) !important;
  color: #fff !important;
  font-weight: 700;
}
</style>
