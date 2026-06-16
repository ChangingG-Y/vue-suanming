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
        <div style="font-weight:700;color:#1c1c1e;margin-bottom:14px;">你今天吃得开心吗？</div>

        <!-- 大号分数展示 -->
        <div style="text-align:center;margin-bottom:16px;">
          <div class="score-circle">
            <span class="score-number">{{ formatScore(score) }}</span>
            <span class="score-unit">分</span>
          </div>
          <div style="font-size:12px;color:#aeaeb2;margin-top:6px;">{{ scoreLabel }}</div>
        </div>

        <!-- 滑动条 -->
        <div style="padding:0 8px;">
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            v-model.number="score"
            class="score-slider"
            :style="{ '--pct': `${scorePct}%` }"
          />
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#aeaeb2;margin-top:4px;">
            <span>0.5</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>

        <!-- 快捷分数按钮 -->
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:14px;">
          <button
            v-for="v in quickScores"
            :key="v"
            :class="['quick-btn', { active: score === v }]"
            @click="score = v"
          >{{ formatScore(v) }}</button>
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
            style="width:80px;height:80px;border:1.5px dashed #e5e5ea;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:24px;cursor:pointer;background:#f2f2f7;gap:2px;"
            @click="triggerUpload"
          >
            <span>{{ uploading ? '⏳' : '📷' }}</span>
            <span v-if="uploading" style="font-size:10px;color:#aeaeb2;">上传中</span>
          </div>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          style="display:none"
          @change="onFilesSelected"
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

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderById, submitReview } from '../../api/orderApi.js'
import { uploadFile } from '../../api/orderFile.js'
import { MEAL_NAMES, MEAL_EMOJIS } from '../../utils/mealType.js'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const score = ref(8)
const content = ref('')
const uploadedImages = ref([])
const submitting = ref(false)
const uploading = ref(false)
const fileInput = ref(null)

// 快捷分数按钮（整数部分）
const quickScores = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const scorePct = computed(() => ((score.value - 0.5) / 9.5) * 100)

const scoreLabel = computed(() => {
  if (score.value <= 2) return '不太满意 😞'
  if (score.value <= 4) return '一般般 😐'
  if (score.value <= 6) return '还不错 🙂'
  if (score.value <= 8) return '很好吃！😊'
  if (score.value < 10) return '超级好吃！😍'
  return '满分小可爱！'
})

function formatScore(v) {
  return Number(v).toFixed(1).replace(/\.0$/, '')
}

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

function resizeToMaxEdge(file, maxEdge = 1200) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxEdge || height > maxEdge) {
        if (width >= height) { height = Math.round(height * maxEdge / width); width = maxEdge }
        else { width = Math.round(width * maxEdge / height); height = maxEdge }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(resolve, 'image/jpeg', 0.88)
    }
    img.src = url
  })
}

async function onFilesSelected(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  const remaining = 3 - uploadedImages.value.length
  const toProcess = files.slice(0, remaining)
  if (!toProcess.length) return
  uploading.value = true
  try {
    await Promise.all(toProcess.map(async (file) => {
      const blob = await resizeToMaxEdge(file, 1200)
      const result = await uploadFile(new File([blob], 'review.jpg', { type: 'image/jpeg' }), 'review')
      const previewUrl = URL.createObjectURL(blob)
      uploadedImages.value.push({ fileId: result.id, previewUrl })
    }))
    showToast({ message: '上传成功', type: 'success' })
  } catch (err) {
    showToast({ message: '上传失败：' + err.message, type: 'fail' })
  } finally {
    uploading.value = false
  }
}

function removeImage(idx) {
  uploadedImages.value.splice(idx, 1)
}

async function submitReviewAction() {
  if (!score.value || score.value <= 0) {
    showToast('请先打分哦~')
    return
  }
  submitting.value = true
  try {
    await submitReview({
      orderId: route.params.orderId,
      score: score.value,
      content: content.value,
      fileIds: uploadedImages.value.map(i => i.fileId),
    })
    showToast({ message: '评价提交成功！', type: 'success' })
    router.replace(`/order/orders/${route.params.orderId}`)
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

/* 大号分数圆圈 */
.score-circle {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  background: linear-gradient(135deg, #c96b7e 0%, #e8829a 100%);
  border-radius: 50%;
  width: 90px;
  height: 90px;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(201, 107, 126, 0.35);
}

.score-number {
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}

.score-unit {
  font-size: 14px;
  color: rgba(255,255,255,0.85);
  font-weight: 600;
  margin-bottom: 4px;
}

/* 滑动条 */
.score-slider {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #c96b7e 0%, #c96b7e var(--pct, 75%), #e5e5ea var(--pct, 75%), #e5e5ea 100%);
  outline: none;
  cursor: pointer;
}

.score-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #c96b7e;
  box-shadow: 0 2px 8px rgba(201, 107, 126, 0.45);
  cursor: pointer;
  border: 3px solid #fff;
}

.score-slider::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #c96b7e;
  box-shadow: 0 2px 8px rgba(201, 107, 126, 0.45);
  cursor: pointer;
  border: 3px solid #fff;
}

/* 快捷按钮 */
.quick-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid #e5e5ea;
  background: #f2f2f7;
  color: #6d6d72;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.quick-btn.active {
  background: #c96b7e;
  border-color: #c96b7e;
  color: #fff;
  box-shadow: 0 2px 8px rgba(201, 107, 126, 0.35);
  transform: scale(1.1);
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
