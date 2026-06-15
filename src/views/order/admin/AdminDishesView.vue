<template>
  <div>
    <!-- 顶部操作栏 -->
    <div style="padding:10px 12px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-weight:700;color:#1c1c1e;font-size:15px;">菜品管理</span>
      <button class="btn-primary" style="padding:8px 16px;font-size:13px;" @click="openAdd">
        ＋ 添加菜品
      </button>
    </div>

    <!-- 分类 tabs -->
    <van-tabs v-model:active="activeCategoryIdx" color="#c96b7e" title-active-color="#c96b7e" @change="onTabChange">
      <van-tab v-for="cat in categories" :key="cat.id" :title="cat.name">
        <div style="padding:8px 12px;">
          <div v-if="loadingDishes" style="text-align:center;padding:40px;">
            <van-loading color="#c96b7e" />
          </div>
          <div v-else-if="dishes.length === 0" style="text-align:center;padding:40px;color:#aeaeb2;">
            <div style="font-size:36px;">🍽️</div>
            <p style="margin-top:8px;font-size:13px;">暂无菜品</p>
          </div>
          <div
            v-else
            v-for="dish in dishes"
            :key="dish.id"
            class="dish-item"
          >
            <!-- 图片 -->
            <div style="width:60px;height:60px;border-radius:10px;background:#fef4f5;flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:24px;">
              <img v-if="dish.imageFileId" :src="thumbUrl(dish.imageFileId)" style="width:60px;height:60px;object-fit:cover;" />
              <span v-else>🍽️</span>
            </div>
            <!-- 信息 -->
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:14px;color:#1c1c1e;">{{ dish.name }}</div>
              <div v-if="dish.description" style="font-size:12px;color:#aeaeb2;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ dish.description }}</div>
              <div style="color:#c96b7e;font-size:13px;font-weight:600;margin-top:3px;">{{ dish.price }}个😘</div>
            </div>
            <!-- 操作 -->
            <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
              <van-switch
                v-model="dish.available"
                size="20px"
                active-color="#c96b7e"
                @change="toggleAvailable(dish)"
              />
              <button class="btn-edit" @click="openEdit(dish)">编辑</button>
              <button class="btn-delete" @click="confirmDelete(dish)">删除</button>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>

    <!-- 编辑/添加弹窗 -->
    <van-popup
      v-model:show="showForm"
      position="bottom"
      round
      :style="{ maxHeight: '85vh', overflowY: 'auto' }"
    >
      <div style="padding:20px 16px;">
        <div style="font-size:16px;font-weight:700;color:#1c1c1e;margin-bottom:16px;">
          {{ editingDish?.id ? '编辑菜品' : '添加菜品' }}
        </div>

        <div class="form-group">
          <label>菜品名称 *</label>
          <input v-model="form.name" placeholder="请输入菜品名称" />
        </div>

        <div class="form-group">
          <label>描述</label>
          <input v-model="form.description" placeholder="简单描述一下" />
        </div>

        <div class="form-group">
          <label>价格（😘数）*</label>
          <input v-model.number="form.price" type="number" min="1" placeholder="几个😘" />
        </div>

        <div class="form-group">
          <label>所属分类 *</label>
          <select v-model="form.categoryId" style="width:100%;padding:10px;border:1px solid #e5e5ea;border-radius:10px;font-size:14px;outline:none;background:#fff;color:#1c1c1e;">
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <!-- 图片上传 -->
        <div class="form-group">
          <label>菜品图片</label>
          <div style="display:flex;gap:10px;margin-top:6px;">
            <div v-if="form.imagePreview" style="position:relative;">
              <img :src="form.imagePreview" style="width:80px;height:80px;border-radius:10px;object-fit:cover;border:1px solid #e5e5ea;" />
              <span
                style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;background:#ff3b30;color:#fff;border-radius:50%;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;"
                @click="clearImage"
              >×</span>
            </div>
            <div
              v-else
              style="width:80px;height:80px;border:1.5px dashed #e5e5ea;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer;background:#f2f2f7;"
              @click="triggerFileInput"
            >📷</div>
          </div>
          <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileSelected" />
        </div>

        <div style="display:flex;gap:10px;margin-top:16px;">
          <button class="btn-cancel" style="flex:1;padding:13px;" @click="showForm = false">取消</button>
          <button class="btn-primary" style="flex:2;padding:13px;" :disabled="saving" @click="saveDishForm">
            {{ saving ? '保存中...' : '保存菜品' }}
          </button>
        </div>
      </div>
    </van-popup>

    <!-- 图片裁切 -->
    <ImageCropper
      :visible="showCropper"
      :img-src="cropSrc"
      @confirm="onCropConfirm"
      @cancel="showCropper = false"
    />

    <!-- 删除确认 -->
    <van-dialog
      v-model:show="showDeleteConfirm"
      title="删除菜品"
      message="确定要删除这道菜品吗？"
      show-cancel-button
      confirm-button-color="#c96b7e"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAdminCategories, getAdminDishes, saveDish, updateDish, deleteDish } from '../../../api/orderAdmin.js'
import { uploadFile, thumbUrl } from '../../../api/orderFile.js'
import { showToast } from 'vant'
import ImageCropper from '../../../components/order/ImageCropper.vue'

const categories = ref([])
const dishes = ref([])
const activeCategoryIdx = ref(0)
const loadingDishes = ref(false)
const showForm = ref(false)
const editingDish = ref(null)
const saving = ref(false)
const showDeleteConfirm = ref(false)
const deletingDish = ref(null)
const fileInput = ref(null)
const showCropper = ref(false)
const cropSrc = ref('')

const form = ref({
  name: '',
  description: '',
  price: 1,
  categoryId: null,
  imageFileId: null,
  imagePreview: null,
})

onMounted(async () => {
  try {
    categories.value = await getAdminCategories() || []
    if (categories.value.length > 0) {
      await loadDishes(categories.value[0].id)
    }
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
})

async function loadDishes(categoryId) {
  loadingDishes.value = true
  try {
    dishes.value = await getAdminDishes(categoryId) || []
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
  loadingDishes.value = false
}

async function onTabChange(idx) {
  if (categories.value[idx]) {
    await loadDishes(categories.value[idx].id)
  }
}

async function toggleAvailable(dish) {
  try {
    await updateDish(dish.id, { ...dish, available: dish.available })
    showToast({ message: dish.available ? '已上架' : '已下架', type: 'success' })
  } catch (e) {
    dish.available = !dish.available
    showToast({ message: e.message, type: 'fail' })
  }
}

function openAdd() {
  editingDish.value = null
  form.value = {
    name: '',
    description: '',
    price: 1,
    categoryId: categories.value[activeCategoryIdx.value]?.id || null,
    imageFileId: null,
    imagePreview: null,
  }
  showForm.value = true
}

function openEdit(dish) {
  editingDish.value = dish
  form.value = {
    name: dish.name,
    description: dish.description || '',
    price: dish.price || 1,
    categoryId: dish.categoryId,
    imageFileId: dish.imageFileId || null,
    imagePreview: dish.imageFileId ? thumbUrl(dish.imageFileId) : null,
  }
  showForm.value = true
}

function clearImage() {
  form.value.imageFileId = null
  form.value.imagePreview = null
}

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileSelected(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = evt => {
    cropSrc.value = evt.target.result
    showCropper.value = true
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

async function onCropConfirm(blob) {
  showCropper.value = false
  try {
    const result = await uploadFile(new File([blob], 'dish.jpg', { type: 'image/jpeg' }))
    form.value.imageFileId = result.id  // 后端返回 FileRespDto，取 id 字段
    form.value.imagePreview = URL.createObjectURL(blob)
    showToast({ message: '图片上传成功', type: 'success' })
  } catch (e) {
    showToast({ message: '上传失败：' + e.message, type: 'fail' })
  }
}

async function saveDishForm() {
  if (!form.value.name) {
    showToast('请输入菜品名称')
    return
  }
  if (!form.value.price || form.value.price < 1) {
    showToast('请输入有效的😘数')
    return
  }
  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description,
      price: form.value.price,
      categoryId: form.value.categoryId,
      imageFileId: form.value.imageFileId,
    }
    if (editingDish.value?.id) {
      await updateDish(editingDish.value.id, payload)
      showToast({ message: '更新成功', type: 'success' })
    } else {
      await saveDish(payload)
      showToast({ message: '添加成功', type: 'success' })
    }
    showForm.value = false
    if (categories.value[activeCategoryIdx.value]) {
      await loadDishes(categories.value[activeCategoryIdx.value].id)
    }
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
  saving.value = false
}

function confirmDelete(dish) {
  deletingDish.value = dish
  showDeleteConfirm.value = true
}

async function doDelete() {
  if (!deletingDish.value) return
  try {
    await deleteDish(deletingDish.value.id)
    showToast({ message: '已删除', type: 'success' })
    if (categories.value[activeCategoryIdx.value]) {
      await loadDishes(categories.value[activeCategoryIdx.value].id)
    }
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
}
</script>

<style scoped>
.dish-item {
  background: #ffffff;
  border-radius: 14px;
  padding: 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.btn-primary {
  background: #c96b7e;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3px;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #ffffff;
  color: #6d6d72;
  border: 1px solid #e5e5ea;
  border-radius: 22px;
  font-size: 14px;
  cursor: pointer;
}

.btn-edit {
  background: #fef4f5;
  color: #c96b7e;
  border: 1px solid #fef4f5;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
}

.btn-delete {
  background: #ffffff;
  color: #aeaeb2;
  border: 1px solid #e5e5ea;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: #6d6d72;
  font-weight: 600;
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e5e5ea;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
  color: #1c1c1e;
  background: #ffffff;
}

.form-group input:focus {
  border-color: #c96b7e;
}
</style>
