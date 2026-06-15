<template>
  <div style="padding-bottom:80px;background:#f2f2f7;min-height:100vh;">
    <div class="page-header" style="display:flex;align-items:center;gap:10px;">
      <span style="cursor:pointer;font-size:18px;color:#c96b7e;" @click="$router.back()">←</span>
      写评价
    </div>

    <!-- 订单信息 -->
    <div style="padding:12px;">
      <div v-if="order" class="order-card">
        <div style="font-size:14px;color:#6d6d72;">
          <span style="font-size:18px;">{{ MEAL_EMOJIS[order.mealType] }}</span>
          {{ MEAL_NAMES[order.mealType] }}
          <span style="margin-left:8px;color:#aeaeb2;font-size:12px;">{{ formatTime(order.createdAt) }}</span>
        </div>
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;">
          <span v-for="item in order.items" :key="item.dishId" class="tag-badge">
            {{ item.dishName }} ×{{ item.quantity }}
          </span>
        </div>
      </div>

      <!-- 评分 -->
      <div class="order-card">
        <div style="font-weight:700;color:#1c1c1e;margin-bottom:12px;">你今天吃得开心吗？</div>
        <div class="heart-rating">
          <span
            v-for="i in 10"
            :key="i"
            :class="['heart', { active: i <= score }]"
            @click="score = i"
          >{{ i <= score ? '💗' : '🤍' }}</span>
        </div>
        <div style="text-align:center;margin-top:8px;font-size:14px;color:#c96b7e;font-weight:600;">
          {{ score }} 分 / 10 分
        </div>
      </div>

      <!-- 评价文字 -->
      <div class="order-card">
        <div style="font-weight:700;color:#1c1c1e;margin-bottom:8px;">说说感受 ✍️</div>
        <textarea
          v-model="content"
          placeholder="今天的菜好吃吗？有什么想说的~"
          rows="4"
          style="width:100%;padding:10px;border:1px solid #e5e5ea;border-radius:10px;font-size:14px;outline:none;resize:none;box-sizing:border-box;font-family:inherit;color:#1c1c1e;background:#ffffff;"
        />
      </div>

      <!-- 图片上传 -->
      <div class="order-card">
        <div style="font-weight:700;color:#1c1c1e;margin-bottom:10px;">上传照片（最多3张）📸</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div
            v-for="(img, idx) in uploadedImages"
            :key="idx"
            style="position:relative;width:80px;height:80px;"
          >
            <img :src="img.previewUrl" style="width:80px;height:80px;border-radius:10px;object-fit:cover;border:1px solid #e5e5ea;" />
            <span
              style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;background:#ff3b30;color:#fff;border-radius:50%;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;"
              @click="removeImage(idx)"
            >×</span>
          </div>
          <div
            v-if="uploadedImages.length < 3"
            style="width:80px;height:80px;border:1.5px dashed #e5e5ea;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer;background:#f2f2f7;"
            @click="triggerUpload"
          >
            📷
          </div>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          style="display:none"
          @change="onFileSelected"
        />
      </div>

      <!-- 提交按钮 -->
      <button
        class="btn-primary"
        style="width:100%;padding:14px;margin-top:4px;"
        :disabled="submitting || score === 0"
        @click="submitReviewAction"
      >
        {{ submitting ? '提交中...' : '提交评价' }}
      </button>
    </div>

    <!-- 图片裁切组件 -->
    <ImageCropper
      :visible="showCropper"
      :img-src="cropSrc"
      @confirm="onCropConfirm"
      @cancel="showCropper = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderById, submitReview } from '../../api/orderApi.js'
import { uploadFile } from '../../api/orderFile.js'
import { MEAL_NAMES, MEAL_EMOJIS } from '../../utils/mealType.js'
import { showToast } from 'vant'
import ImageCropper from '../../components/order/ImageCropper.vue'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const score = ref(0)
const content = ref('')
const uploadedImages = ref([]) // [{ fileId, previewUrl }]
const submitting = ref(false)
const fileInput = ref(null)
const showCropper = ref(false)
const cropSrc = ref('')

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  try {
    order.value = await getOrderById(route.params.orderId)
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
})

function triggerUpload() {
  fileInput.value?.click()
}

function onFileSelected(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (evt) => {
    cropSrc.value = evt.target.result
    showCropper.value = true
  }
  reader.readAsDataURL(file)
  // reset input
  e.target.value = ''
}

async function onCropConfirm(blob) {
  showCropper.value = false
  try {
    const fileId = await uploadFile(new File([blob], 'review.jpg', { type: 'image/jpeg' }))
    const previewUrl = URL.createObjectURL(blob)
    uploadedImages.value.push({ fileId, previewUrl })
    showToast({ message: '上传成功', type: 'success' })
  } catch (e) {
    showToast({ message: '上传失败：' + e.message, type: 'fail' })
  }
}

function removeImage(idx) {
  uploadedImages.value.splice(idx, 1)
}

async function submitReviewAction() {
  if (score.value === 0) {
    showToast('请先打分哦~')
    return
  }
  submitting.value = true
  try {
    await submitReview({
      orderId: route.params.orderId,
      score: score.value,
      content: content.value,
      imageFileIds: uploadedImages.value.map(i => i.fileId),
    })
    showToast({ message: '评价提交成功！', type: 'success' })
    router.back()
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
  submitting.value = false
}
</script>

<style scoped>
.page-header {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(229, 229, 234, 0.7);
  padding: 14px 16px;
  font-weight: 700;
  font-size: 17px;
  color: #1c1c1e;
  position: sticky;
  top: 0;
  z-index: 5;
}

.order-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.tag-badge {
  display: inline-block;
  background: #fef4f5;
  color: #c96b7e;
  border-radius: 6px;
  font-size: 12px;
  padding: 3px 8px;
  font-weight: 500;
}

.heart-rating {
  display: flex;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

.heart {
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.1s;
  user-select: none;
}

.heart:hover {
  transform: scale(1.2);
}

.btn-primary {
  background: #c96b7e;
  color: #fff;
  border: none;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.3px;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
