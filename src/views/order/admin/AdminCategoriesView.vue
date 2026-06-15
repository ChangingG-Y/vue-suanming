<template>
  <div style="padding:12px;">
    <!-- 操作栏 -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <span style="font-weight:700;color:#1c1c1e;font-size:15px;">分类管理</span>
      <button class="btn-primary" style="padding:8px 16px;font-size:13px;" @click="openAdd">
        ＋ 添加分类
      </button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" style="text-align:center;padding:40px;">
      <van-loading color="#c96b7e" />
    </div>

    <!-- 分类列表 -->
    <div v-else>
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="cat-item"
      >
        <div>
          <div style="font-weight:700;font-size:15px;color:#1c1c1e;">{{ cat.name }}</div>
          <div v-if="cat.description" style="font-size:12px;color:#aeaeb2;margin-top:3px;">{{ cat.description }}</div>
          <div style="font-size:11px;color:#aeaeb2;margin-top:3px;">排序：{{ cat.seq }}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn-edit" @click="openEdit(cat)">编辑</button>
          <button class="btn-delete" @click="confirmDelete(cat)">删除</button>
        </div>
      </div>

      <div v-if="categories.length === 0" style="text-align:center;padding:40px;color:#aeaeb2;">
        <div style="font-size:36px;">📋</div>
        <p style="margin-top:8px;font-size:13px;">还没有分类，快去添加吧~</p>
      </div>
    </div>

    <!-- 编辑/添加弹窗 -->
    <van-popup
      v-model:show="showForm"
      position="bottom"
      round
      :style="{ maxHeight: '60vh', overflowY: 'auto' }"
    >
      <div style="padding:20px 16px;">
        <div style="font-size:16px;font-weight:700;color:#1c1c1e;margin-bottom:16px;">
          {{ editingCat?.id ? '编辑分类' : '添加分类' }}
        </div>

        <div class="form-group">
          <label>分类名称 *</label>
          <input v-model="form.name" placeholder="请输入分类名称" @keyup.enter="saveForm" />
        </div>

        <div class="form-group">
          <label>描述</label>
          <input v-model="form.description" placeholder="简单描述一下" />
        </div>

        <div class="form-group">
          <label>排序（数字越小越前）</label>
          <input v-model.number="form.seq" type="number" min="0" placeholder="0" />
        </div>

        <div style="display:flex;gap:10px;margin-top:16px;">
          <button class="btn-cancel" style="flex:1;padding:13px;" @click="showForm = false">取消</button>
          <button class="btn-primary" style="flex:2;padding:13px;" :disabled="saving" @click="saveForm">
            {{ saving ? '保存中...' : '保存分类' }}
          </button>
        </div>
      </div>
    </van-popup>

    <!-- 删除确认 -->
    <van-dialog
      v-model:show="showDeleteConfirm"
      title="删除分类"
      :message="`确定要删除分类「${deletingCat?.name}」吗？`"
      show-cancel-button
      confirm-button-color="#c96b7e"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAdminCategories, saveCategory, updateCategory, deleteCategory } from '../../../api/orderAdmin.js'
import { showToast } from 'vant'

const categories = ref([])
const loading = ref(true)
const showForm = ref(false)
const editingCat = ref(null)
const saving = ref(false)
const showDeleteConfirm = ref(false)
const deletingCat = ref(null)

const form = ref({ name: '', description: '', seq: 0 })

async function loadCategories() {
  loading.value = true
  try {
    categories.value = await getAdminCategories() || []
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
  loading.value = false
}

function openAdd() {
  editingCat.value = null
  form.value = { name: '', description: '', seq: 0 }
  showForm.value = true
}

function openEdit(cat) {
  editingCat.value = cat
  form.value = { name: cat.name, description: cat.description || '', seq: cat.seq || 0 }
  showForm.value = true
}

async function saveForm() {
  if (!form.value.name) {
    showToast('请输入分类名称')
    return
  }
  saving.value = true
  try {
    if (editingCat.value?.id) {
      await updateCategory(editingCat.value.id, form.value)
      showToast({ message: '更新成功', type: 'success' })
    } else {
      await saveCategory(form.value)
      showToast({ message: '添加成功', type: 'success' })
    }
    showForm.value = false
    await loadCategories()
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
  saving.value = false
}

function confirmDelete(cat) {
  deletingCat.value = cat
  showDeleteConfirm.value = true
}

async function doDelete() {
  if (!deletingCat.value) return
  try {
    await deleteCategory(deletingCat.value.id)
    showToast({ message: '已删除', type: 'success' })
    await loadCategories()
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
}

onMounted(loadCategories)
</script>

<style scoped>
.cat-item {
  background: #ffffff;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}

.btn-delete {
  background: #ffffff;
  color: #aeaeb2;
  border: 1px solid #e5e5ea;
  border-radius: 8px;
  padding: 6px 12px;
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
