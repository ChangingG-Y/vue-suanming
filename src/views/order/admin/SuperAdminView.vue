<template>
  <div style="padding:16px;max-width:640px;margin:0 auto;">
    <div style="font-size:16px;font-weight:700;color:#1c1c1e;margin-bottom:16px;">🌐 超级管理</div>

    <!-- 租户列表 -->
    <div class="section-title">租户列表</div>
    <div v-if="loadingTenants" style="text-align:center;padding:30px;">
      <van-loading color="#c96b7e" />
    </div>
    <div v-else>
      <div
        v-for="t in tenants"
        :key="t.id"
        class="tenant-card"
        :class="{ 'tenant-active': selectedTenantId === t.id }"
        @click="selectTenant(t)"
      >
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:700;font-size:14px;color:#1c1c1e;">{{ t.name }}</div>
            <div v-if="t.description" style="font-size:12px;color:#aeaeb2;margin-top:2px;">{{ t.description }}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="user-count">{{ t.userCount }} 人</span>
            <span style="font-size:12px;color:#aeaeb2;">#{{ t.id }}</span>
          </div>
        </div>
      </div>
      <button class="btn-outline" style="width:100%;margin-top:8px;" @click="showCreateTenant = true">
        ＋ 创建新租户
      </button>
    </div>

    <!-- 用户管理 -->
    <template v-if="selectedTenantId">
      <div class="section-title" style="margin-top:20px;">
        租户 #{{ selectedTenantId }} · {{ selectedTenantName }} · 用户管理
      </div>
      <div v-if="loadingUsers" style="text-align:center;padding:20px;">
        <van-loading color="#c96b7e" size="20px" />
      </div>
      <div v-else>
        <div v-for="u in users" :key="u.id" class="user-card">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:14px;color:#1c1c1e;">
              {{ u.nickname || u.username }}
              <span class="role-badge" :class="`role-${u.role}`">{{ roleName(u.role) }}</span>
            </div>
            <div style="font-size:12px;color:#aeaeb2;margin-top:2px;">@{{ u.username }} · #{{ u.id }}</div>
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0;">
            <button class="btn-sm btn-edit" @click="openEditPassword(u)">改密</button>
            <button class="btn-sm btn-edit" @click="openEditRole(u)">角色</button>
            <button class="btn-sm btn-delete" @click="confirmDeleteUser(u)">删除</button>
          </div>
        </div>
        <button class="btn-outline" style="width:100%;margin-top:8px;" @click="openCreateUser">
          ＋ 添加用户
        </button>
      </div>
    </template>

    <!-- 创建租户弹窗 -->
    <van-popup v-model:show="showCreateTenant" position="bottom" round :style="{ padding: '20px 16px', maxHeight: '60vh', overflowY: 'auto' }">
      <div style="font-size:15px;font-weight:700;color:#1c1c1e;margin-bottom:16px;">创建新租户</div>
      <div class="form-group">
        <label>租户名称 *</label>
        <input v-model="newTenant.name" placeholder="例：某某补给站" />
      </div>
      <div class="form-group">
        <label>描述</label>
        <input v-model="newTenant.description" placeholder="简单描述一下" />
      </div>
      <div style="display:flex;gap:10px;margin-top:12px;">
        <button class="btn-cancel" style="flex:1;padding:12px;" @click="showCreateTenant = false">取消</button>
        <button class="btn-primary" style="flex:2;padding:12px;" :disabled="creating" @click="doCreateTenant">
          {{ creating ? '创建中...' : '创建租户' }}
        </button>
      </div>
    </van-popup>

    <!-- 添加用户弹窗 -->
    <van-popup v-model:show="showCreateUser" position="bottom" round :style="{ padding: '20px 16px', maxHeight: '70vh', overflowY: 'auto' }">
      <div style="font-size:15px;font-weight:700;color:#1c1c1e;margin-bottom:16px;">添加用户</div>
      <div class="form-group">
        <label>用户名 *</label>
        <input v-model="newUser.username" placeholder="登录用，全局唯一" />
      </div>
      <div class="form-group">
        <label>密码 *</label>
        <input v-model="newUser.password" type="password" placeholder="登录密码" />
      </div>
      <div class="form-group">
        <label>昵称</label>
        <input v-model="newUser.nickname" placeholder="显示名称（可选）" />
      </div>
      <div class="form-group">
        <label>角色</label>
        <select v-model.number="newUser.role" style="width:100%;padding:10px;border:1px solid #e5e5ea;border-radius:10px;font-size:14px;outline:none;background:#fff;">
          <option :value="2">普通用户</option>
          <option :value="1">租户管理员</option>
        </select>
      </div>
      <div style="display:flex;gap:10px;margin-top:12px;">
        <button class="btn-cancel" style="flex:1;padding:12px;" @click="showCreateUser = false">取消</button>
        <button class="btn-primary" style="flex:2;padding:12px;" :disabled="creating" @click="doCreateUser">
          {{ creating ? '添加中...' : '添加用户' }}
        </button>
      </div>
    </van-popup>

    <!-- 修改密码弹窗 -->
    <van-popup v-model:show="showEditPassword" position="bottom" round :style="{ padding: '20px 16px' }">
      <div style="font-size:15px;font-weight:700;color:#1c1c1e;margin-bottom:16px;">
        修改密码 · {{ editingUser?.nickname || editingUser?.username }}
      </div>
      <div class="form-group">
        <label>新密码 *</label>
        <input v-model="newPassword" type="password" placeholder="输入新密码" />
      </div>
      <div style="display:flex;gap:10px;margin-top:12px;">
        <button class="btn-cancel" style="flex:1;padding:12px;" @click="showEditPassword = false">取消</button>
        <button class="btn-primary" style="flex:2;padding:12px;" :disabled="saving" @click="doUpdatePassword">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </van-popup>

    <!-- 修改角色弹窗 -->
    <van-popup v-model:show="showEditRole" position="bottom" round :style="{ padding: '20px 16px' }">
      <div style="font-size:15px;font-weight:700;color:#1c1c1e;margin-bottom:16px;">
        修改角色 · {{ editingUser?.nickname || editingUser?.username }}
      </div>
      <van-radio-group v-model.number="editRole" style="gap:12px;display:flex;flex-direction:column;margin:12px 0;">
        <van-radio :name="2" checked-color="#c96b7e"><span style="font-size:14px;">普通用户</span></van-radio>
        <van-radio :name="1" checked-color="#c96b7e"><span style="font-size:14px;">租户管理员</span></van-radio>
        <van-radio :name="0" checked-color="#c96b7e"><span style="font-size:14px;">超级管理员</span></van-radio>
      </van-radio-group>
      <div style="display:flex;gap:10px;margin-top:12px;">
        <button class="btn-cancel" style="flex:1;padding:12px;" @click="showEditRole = false">取消</button>
        <button class="btn-primary" style="flex:2;padding:12px;" :disabled="saving" @click="doUpdateRole">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </van-popup>

    <!-- 删除确认 -->
    <van-dialog
      v-model:show="showDeleteConfirm"
      title="删除用户"
      :message="`确定删除用户「${deletingUser?.nickname || deletingUser?.username}」吗？`"
      show-cancel-button
      confirm-button-color="#ff3b30"
      @confirm="doDeleteUser"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  listTenants, createTenant,
  listTenantUsers, createTenantUser,
  updateUserPassword, updateUserRole, deleteTenantUser
} from '../../../api/orderSuperAdmin.js'
import { showToast } from 'vant'

const tenants = ref([])
const loadingTenants = ref(true)
const selectedTenantId = ref(null)
const selectedTenantName = ref('')
const users = ref([])
const loadingUsers = ref(false)

const showCreateTenant = ref(false)
const showCreateUser = ref(false)
const showEditPassword = ref(false)
const showEditRole = ref(false)
const showDeleteConfirm = ref(false)

const creating = ref(false)
const saving = ref(false)

const newTenant = ref({ name: '', description: '' })
const newUser = ref({ username: '', password: '', nickname: '', role: 2 })
const newPassword = ref('')
const editRole = ref(2)
const editingUser = ref(null)
const deletingUser = ref(null)

function roleName(role) {
  if (role === 0) return '超管'
  if (role === 1) return '管理员'
  return '用户'
}

async function loadTenants() {
  loadingTenants.value = true
  try {
    tenants.value = await listTenants() || []
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
  loadingTenants.value = false
}

async function selectTenant(t) {
  selectedTenantId.value = t.id
  selectedTenantName.value = t.name
  loadingUsers.value = true
  try {
    users.value = await listTenantUsers(t.id) || []
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
  loadingUsers.value = false
}

async function doCreateTenant() {
  if (!newTenant.value.name) { showToast('请输入租户名称'); return }
  creating.value = true
  try {
    const t = await createTenant(newTenant.value)
    tenants.value.unshift(t)
    showCreateTenant.value = false
    newTenant.value = { name: '', description: '' }
    showToast({ message: '租户创建成功', type: 'success' })
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
  creating.value = false
}

function openCreateUser() {
  newUser.value = { username: '', password: '', nickname: '', role: 2 }
  showCreateUser.value = true
}

async function doCreateUser() {
  if (!newUser.value.username || !newUser.value.password) {
    showToast('请输入用户名和密码'); return
  }
  creating.value = true
  try {
    const u = await createTenantUser(selectedTenantId.value, newUser.value)
    users.value.push(u)
    showCreateUser.value = false
    showToast({ message: '用户添加成功', type: 'success' })
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
  creating.value = false
}

function openEditPassword(u) {
  editingUser.value = u
  newPassword.value = ''
  showEditPassword.value = true
}

async function doUpdatePassword() {
  if (!newPassword.value) { showToast('请输入新密码'); return }
  saving.value = true
  try {
    await updateUserPassword(editingUser.value.id, newPassword.value)
    showEditPassword.value = false
    showToast({ message: '密码已修改', type: 'success' })
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
  saving.value = false
}

function openEditRole(u) {
  editingUser.value = u
  editRole.value = u.role
  showEditRole.value = true
}

async function doUpdateRole() {
  saving.value = true
  try {
    await updateUserRole(editingUser.value.id, editRole.value)
    editingUser.value.role = editRole.value
    showEditRole.value = false
    showToast({ message: '角色已更新', type: 'success' })
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
  saving.value = false
}

function confirmDeleteUser(u) {
  deletingUser.value = u
  showDeleteConfirm.value = true
}

async function doDeleteUser() {
  if (!deletingUser.value) return
  try {
    await deleteTenantUser(deletingUser.value.id)
    users.value = users.value.filter(u => u.id !== deletingUser.value.id)
    showToast({ message: '已删除', type: 'success' })
  } catch (e) {
    showToast({ message: e.message, type: 'fail' })
  }
}

onMounted(loadTenants)
</script>

<style scoped>
.section-title {
  font-size: 12px;
  font-weight: 700;
  color: #aeaeb2;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px;
}

.tenant-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: border-color 0.15s;
}
.tenant-active { border-color: #c96b7e; }

.user-count {
  display: inline-block;
  background: #fef4f5;
  color: #c96b7e;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
}

.user-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-badge {
  display: inline-block;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  margin-left: 6px;
}
.role-0 { background: #ff3b30; color: #fff; }
.role-1 { background: #fef4f5; color: #c96b7e; }
.role-2 { background: #f2f2f7; color: #6d6d72; }

.btn-sm {
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}
.btn-edit { background: #fef4f5; color: #c96b7e; }
.btn-delete { background: #f2f2f7; color: #aeaeb2; }

.btn-primary {
  background: #c96b7e;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-cancel {
  background: #fff;
  color: #6d6d72;
  border: 1px solid #e5e5ea;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

.btn-outline {
  background: transparent;
  color: #c96b7e;
  border: 1.5px solid #c96b7e;
  border-radius: 22px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.form-group { margin-bottom: 14px; }
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
  color: #1c1c1e;
}
.form-group input:focus { border-color: #c96b7e; }
</style>
