<template>
  <div class="profile-page">
    <!-- Hero banner -->
    <div class="hero-banner" :class="{ partner: viewPartner }">
      <div class="banner-inner-clip">
        <div class="banner-bg"></div>
        <div class="banner-deco d1"></div>
        <div class="banner-deco d2"></div>
        <div class="banner-deco d3"></div>
      </div>

      <!-- 看看TA / 回到我的 -->
      <button v-if="!viewPartner" class="peek-btn" @click="switchToPartner">看看TA 👀</button>
      <button v-else class="peek-btn back" @click="switchToSelf">← 我的</button>

      <div class="avatar-ring" :class="{ clickable: !viewPartner }" @click="!viewPartner && triggerAvatarUpload()">
        <img v-if="currentProfile.avatarUrl" :src="currentProfile.avatarUrl" class="avatar-img" />
        <div v-else class="avatar-placeholder">{{ (currentProfile.nickname || '?')[0] }}</div>
        <div v-if="!viewPartner" class="avatar-edit-badge">📷</div>
      </div>
      <input v-if="!viewPartner" ref="avatarInputRef" type="file" accept="image/*" style="display:none" @change="onAvatarChange" />
    </div>

    <!-- Profile card -->
    <div class="profile-card" :class="{ partner: viewPartner }">
      <div class="profile-name-row">
        <span class="profile-name">
          {{ currentProfile.nickname || '未设置昵称' }}
          <span v-if="viewPartner" class="ta-badge">TA</span>
        </span>
        <button v-if="!viewPartner" class="edit-btn" @click="openEdit">编辑资料</button>
      </div>
      <div v-if="currentProfile.bio" class="profile-bio">{{ currentProfile.bio }}</div>
      <div class="stats-row">
        <div class="stat-pill">
          <div class="stat-num">{{ currentProfile.height ?? '—' }}</div>
          <div class="stat-unit">cm · 身高</div>
        </div>
        <div class="stat-sep"></div>
        <div class="stat-pill" :class="{ clickable: !viewPartner }" @click="!viewPartner && openWeightInput()">
          <div class="stat-num" :class="viewPartner ? 'weight-partner' : 'weight-num'">
            {{ currentProfile.currentWeight != null ? displayWeight(currentProfile.currentWeight) : (viewPartner ? '—' : '记录') }}
          </div>
          <div class="stat-unit">
            <span v-if="!viewPartner" class="unit-tag" @click.stop="toggleWeightUnit">{{ weightUnit === 'kg' ? 'kg' : '斤' }} ⇄</span>
            <span v-else>{{ weightUnit === 'kg' ? 'kg' : '斤' }}</span>
            · 体重
            <span v-if="currentProfile.currentWeightDate" class="weight-since"> · {{ formatDateShort(currentProfile.currentWeightDate) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Weight trend -->
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">📈 {{ viewPartner ? 'TA 的' : '' }}体重趋势</span>
        <span v-if="!viewPartner" class="section-action" @click="openWeightInput">+ 今日记录</span>
      </div>
      <div v-if="currentWeights.length > 1" class="chart-wrap">
        <svg class="weight-chart" :viewBox="`0 0 ${chartW} ${chartH}`" preserveAspectRatio="none">
          <defs>
            <linearGradient :id="'wg' + (viewPartner ? 'p' : 'm')" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="lineColor" stop-opacity="0.25" />
              <stop offset="100%" :stop-color="lineColor" stop-opacity="0.02" />
            </linearGradient>
          </defs>
          <!-- Y axis labels -->
          <text :x="padL - 4" :y="padT + 5" text-anchor="end" fill="#c8c8cc" font-size="9">{{ chartMaxVal }}</text>
          <text :x="padL - 4" :y="chartH - padB + 3" text-anchor="end" fill="#c8c8cc" font-size="9">{{ chartMinVal }}</text>
          <!-- Grid lines -->
          <line v-for="gy in [padT, padT + (chartH - padT - padB) / 2, chartH - padB]" :key="gy"
            :x1="padL" :y1="gy" :x2="chartW - padR" :y2="gy" stroke="#f0f0f5" stroke-width="1" />
          <path :d="chartAreaPath" :fill="`url(#${viewPartner ? 'wgp' : 'wgm'})`" />
          <path :d="chartLinePath" fill="none" :stroke="lineColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <!-- Value labels at key points -->
          <template v-for="i in chartLabelIndices" :key="'lbl'+i">
            <text v-if="chartPoints[i]"
              :x="clamp(chartPoints[i].x, padL + 14, chartW - padR - 14)"
              :y="chartPoints[i].y - 7"
              text-anchor="middle" :fill="lineColor" font-size="8.5" font-weight="700">
              {{ displayWeight(currentWeights[i].weight) }}
            </text>
          </template>
          <!-- Dots -->
          <circle v-for="(pt, i) in chartPoints" :key="i" :cx="pt.x" :cy="pt.y" r="3.5"
            fill="#fff" :stroke="lineColor" stroke-width="2" style="cursor:pointer"
            @click="tappedWeightIdx = tappedWeightIdx === i ? null : i" />
        </svg>
        <div class="chart-labels">
          <span v-for="(r, i) in chartLabelRecords" :key="i">{{ formatDateShort(r.recordDate) }}</span>
        </div>
      </div>
      <div v-else-if="currentWeights.length === 1" class="empty-chart">
        <div class="solo-weight" :style="{ color: lineColor }">{{ displayWeight(currentWeights[0].weight) }}<span class="solo-unit"> {{ weightUnit === 'kg' ? 'kg' : '斤' }}</span></div>
        <div class="solo-date">{{ formatDateShort(currentWeights[0].recordDate) }}</div>
        <p class="empty-tip">再记一次就能看到趋势图啦 📉</p>
      </div>
      <div v-else class="empty-chart">
        <div class="empty-icon">{{ viewPartner ? '💭' : '🌸' }}</div>
        <p class="empty-tip">{{ viewPartner ? 'TA 还没有体重记录' : '还没有体重记录，点右上角开始吧' }}</p>
      </div>
    </div>

    <!-- Calendar -->
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">📅 {{ viewPartner ? 'TA 的' : '' }}生活日历</span>
        <div class="month-nav">
          <button class="month-btn" @click="changeMonth(-1)">‹</button>
          <span class="month-label">{{ calYear }}年{{ calMonth }}月</span>
          <button class="month-btn" @click="changeMonth(1)">›</button>
        </div>
      </div>
      <div class="cal-legend">
        <span class="legend-item"><span class="legend-emoji">{{ cfg.calEmojiCooking }}</span>{{ cfg.calLabelCooking }}</span>
        <span class="legend-item"><span class="legend-emoji">{{ cfg.calEmojiDining }}</span>{{ cfg.calLabelDining }}</span>
        <span class="legend-item"><span class="legend-emoji">{{ cfg.calEmojiDiary }}</span>{{ cfg.calLabelDiary }}</span>
      </div>
      <div class="calendar-grid">
        <div class="cal-weekday" v-for="d in ['日','一','二','三','四','五','六']" :key="d">{{ d }}</div>
        <div v-for="n in calStartBlank" :key="'b'+n" class="cal-cell-empty"></div>
        <div
          v-for="day in calendarDays" :key="day.date"
          class="cal-cell"
          :class="{
            'active': day.hasOrder || day.hasVisit || day.hasDiary || day.weight != null,
            'today': day.date === todayStr,
            'selected': selectedCalDate === day.date,
            'partner': viewPartner
          }"
          @click="selectCalDay(day)"
        >
          <span class="cal-num" :class="{ 'today-num': day.date === todayStr && !viewPartner, 'today-num-partner': day.date === todayStr && viewPartner }">{{ +day.date.split('-')[2] }}</span>
          <div class="cal-emojis">
            <span v-if="day.hasOrder">{{ cfg.calEmojiCooking }}</span>
            <span v-if="day.hasVisit">{{ cfg.calEmojiDining }}</span>
            <span v-if="day.hasDiary">{{ cfg.calEmojiDiary }}</span>
          </div>
          <span v-if="day.weight" class="cal-kg" :class="{ 'partner-kg': viewPartner }">{{ displayWeight(day.weight) }}</span>
        </div>
      </div>
    </div>

    <!-- Quick-action bar (self only) -->
    <transition name="slide-up">
      <div v-if="!viewPartner && selectedCalDate" class="quick-bar">
        <span class="quick-date">{{ selectedCalDate }}</span>
        <div class="quick-btns">
          <button class="qb dining" @click="openVisitForm(selectedCalDate)">
            <span class="qb-icon">{{ cfg.calEmojiDining }}</span>
            <span class="qb-lbl">{{ cfg.calLabelDining }}</span>
          </button>
          <button class="qb diary" @click="openDiaryForm(selectedCalDate)">
            <span class="qb-icon">{{ cfg.calEmojiDiary }}</span>
            <span class="qb-lbl">{{ cfg.calLabelDiary }}</span>
          </button>
          <button class="qb weight" @click="openWeightForDate(selectedCalDate)">
            <span class="qb-icon">⚖️</span>
            <span class="qb-lbl">体重</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- Weight list (self) -->
    <div v-if="!viewPartner && myWeights.length > 0" class="section-card">
      <div class="section-header">
        <span class="section-title">⚖️ 近期记录</span>
        <span class="section-action unit-tag-small" @click="toggleWeightUnit">{{ weightUnit === 'kg' ? '切换斤' : '切换kg' }}</span>
      </div>
      <div class="weight-list">
        <div v-for="r in [...myWeights].reverse().slice(0, 10)" :key="r.id" class="wt-row">
          <div class="wt-left">
            <span class="wt-date">{{ r.recordDate }}</span>
            <span v-if="r.note" class="wt-note">{{ r.note }}</span>
          </div>
          <div class="wt-right">
            <span class="wt-val">{{ displayWeight(r.weight) }}<span class="wt-unit"> {{ weightUnit === 'kg' ? 'kg' : '斤' }}</span></span>
            <button class="wt-del" @click="confirmDeleteWeight(r)">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Weight list (partner, read-only) -->
    <div v-if="viewPartner && partnerWeights.length > 0" class="section-card">
      <div class="section-header"><span class="section-title">⚖️ TA 的近期记录</span></div>
      <div class="weight-list">
        <div v-for="r in [...partnerWeights].reverse().slice(0, 10)" :key="r.id" class="wt-row">
          <div class="wt-left">
            <span class="wt-date">{{ r.recordDate }}</span>
            <span v-if="r.note" class="wt-note">{{ r.note }}</span>
          </div>
          <span class="wt-val" style="color:#5b8af0">{{ displayWeight(r.weight) }}<span class="wt-unit"> {{ weightUnit === 'kg' ? 'kg' : '斤' }}</span></span>
        </div>
      </div>
    </div>

    <!-- ===== Modals ===== -->

    <!-- Edit profile -->
    <van-popup v-model:show="showEditModal" round position="bottom" safe-area-inset-bottom>
      <div class="sheet-handle"></div>
      <div class="sheet-inner">
        <div class="sheet-title">编辑资料</div>
        <div class="form-field">
          <div class="form-label">昵称</div>
          <input v-model="editForm.nickname" class="form-input" placeholder="输入昵称" />
        </div>
        <div class="form-field">
          <div class="form-label">身高 (cm)</div>
          <input v-model="editForm.height" class="form-input" type="number" placeholder="如 175" />
        </div>
        <div class="form-field">
          <div class="form-label">个人签名</div>
          <textarea v-model="editForm.bio" class="form-textarea" placeholder="一句话介绍自己" rows="2"></textarea>
        </div>
        <div class="sheet-btns">
          <button class="s-cancel" @click="showEditModal = false">取消</button>
          <button class="s-confirm" :disabled="saving" @click="saveProfile">{{ saving ? '保存中…' : '保存' }}</button>
        </div>
      </div>
    </van-popup>

    <!-- Weight -->
    <van-popup v-model:show="showWeightModal" round position="bottom" safe-area-inset-bottom>
      <div class="sheet-handle"></div>
      <div class="sheet-inner">
        <div class="sheet-title">⚖️ 记录体重</div>
        <div class="form-field">
          <div class="form-label">日期</div>
          <input v-model="weightForm.recordDate" class="form-input" type="date" />
        </div>
        <div class="form-field">
          <div class="form-label" style="justify-content:space-between;">
            <span>体重</span>
            <button class="unit-toggle-btn" @click="toggleWeightUnit">切换为 {{ weightUnit === 'kg' ? '斤' : 'kg' }}</button>
          </div>
          <div class="weight-slider-wrap" @mousedown="startWeightDrag" @touchstart.prevent="startWeightDrag" :class="{ dragging: isWeightDragging }">
            <button class="ws-arrow" @click.stop="adjustWeight(-0.5)">‹</button>
            <div class="ws-display">
              <span class="ws-val">{{ weightDisplayVal.toFixed(1) }}</span>
              <span class="ws-unit-lbl">{{ weightUnit === 'kg' ? 'kg' : '斤' }}</span>
            </div>
            <button class="ws-arrow" @click.stop="adjustWeight(0.5)">›</button>
          </div>
          <div class="ws-hint">← 左右拖动调节，精度 0.1 →</div>
        </div>
        <div class="form-field">
          <div class="form-label">备注 <span class="form-hint">选填</span></div>
          <input v-model="weightForm.note" class="form-input" placeholder="今天感觉怎么样…" />
        </div>
        <div class="sheet-btns">
          <button class="s-cancel" @click="showWeightModal = false">取消</button>
          <button class="s-confirm" :disabled="savingWeight" @click="doSaveWeight">{{ savingWeight ? '记录中…' : '记录' }}</button>
        </div>
      </div>
    </van-popup>

    <!-- Visit -->
    <van-popup v-model:show="showVisitModal" round position="bottom" safe-area-inset-bottom :style="{maxHeight:'90vh',overflowY:'auto'}">
      <div class="sheet-handle"></div>
      <div class="date-strip-wrap">
        <div class="date-strip">
          <div v-for="d in dateStripDays" :key="d.str"
               class="date-strip-item"
               :class="{ active: visitForm.visitDate === d.str }"
               @click="visitForm.visitDate = d.str">
            <div class="ds-weekday">{{ d.weekday }}</div>
            <div class="ds-day">{{ d.day }}</div>
          </div>
        </div>
      </div>
      <div class="sheet-inner" style="padding-top:12px;">
        <div class="sheet-title">{{ cfg.calEmojiDining }} {{ cfg.calLabelDining }}</div>
        <div class="form-field">
          <div class="form-label">餐次</div>
          <div class="seg-ctrl">
            <button v-for="(n, i) in ['早饭','午饭','晚饭']" :key="i" class="seg-btn" :class="{ on: visitForm.mealType === i }" @click="visitForm.mealType = i">{{ n }}</button>
          </div>
        </div>
        <div class="form-field">
          <div class="form-label">餐厅名称</div>
          <input v-model="visitForm.restaurantName" class="form-input" placeholder="叫什么名字呀" />
        </div>
        <div class="form-field">
          <div class="form-label">评分</div>
          <div class="stars">
            <span v-for="n in 5" :key="n" class="star" :class="{ lit: visitForm.score >= n }" @click="visitForm.score = n">★</span>
          </div>
        </div>
        <div class="form-field">
          <div class="form-label">点评 <span class="form-hint">选填</span></div>
          <textarea v-model="visitForm.content" class="form-textarea" placeholder="好不好吃，环境怎么样…" rows="3"></textarea>
        </div>
        <div class="form-field">
          <div class="form-label">照片 <span class="form-hint">最多 3 张</span></div>
          <div class="photo-grid">
            <div v-for="(p, i) in visitPhotoPreviews" :key="i" class="photo-slot">
              <img :src="p" class="photo-img" />
              <button class="photo-x" @click="removeVisitPhoto(i)">✕</button>
            </div>
            <button v-if="visitPhotoPreviews.length < 3" class="photo-add" @click="$refs.visitPhotoInput.click()">
              <span class="photo-add-icon">+</span>
            </button>
          </div>
          <input ref="visitPhotoInput" type="file" accept="image/*" style="display:none" @change="onVisitPhotoChange" />
        </div>
        <div class="sheet-btns">
          <button class="s-cancel" @click="showVisitModal = false">取消</button>
          <button class="s-confirm dining" :disabled="savingVisit" @click="doSaveVisit">{{ savingVisit ? '保存中…' : '保存记录' }}</button>
        </div>
      </div>
    </van-popup>

    <!-- Diary -->
    <van-popup v-model:show="showDiaryModal" round position="bottom" safe-area-inset-bottom :style="{maxHeight:'90vh',overflowY:'auto'}">
      <div class="sheet-handle"></div>
      <div class="date-strip-wrap">
        <div class="date-strip">
          <div v-for="d in dateStripDays" :key="d.str"
               class="date-strip-item"
               :class="{ active: diaryForm.diaryDate === d.str }"
               @click="diaryForm.diaryDate = d.str">
            <div class="ds-weekday">{{ d.weekday }}</div>
            <div class="ds-day">{{ d.day }}</div>
          </div>
        </div>
      </div>
      <div class="sheet-inner" style="padding-top:12px;">
        <div class="sheet-title">{{ cfg.calEmojiDiary }} {{ cfg.calLabelDiary }}</div>
        <div class="form-field">
          <div class="form-label">今天的故事</div>
          <textarea v-model="diaryForm.content" class="form-textarea diary-ta" placeholder="今天发生了什么有趣的事…" rows="7"></textarea>
        </div>
        <div class="form-field">
          <div class="form-label">照片 <span class="form-hint">最多 3 张</span></div>
          <div class="photo-grid">
            <div v-for="(p, i) in diaryPhotoPreviews" :key="i" class="photo-slot">
              <img :src="p" class="photo-img" />
              <button class="photo-x" @click="removeDiaryPhoto(i)">✕</button>
            </div>
            <button v-if="diaryPhotoPreviews.length < 3" class="photo-add" @click="$refs.diaryPhotoInput.click()">
              <span class="photo-add-icon">+</span>
            </button>
          </div>
          <input ref="diaryPhotoInput" type="file" accept="image/*" style="display:none" @change="onDiaryPhotoChange" />
        </div>
        <div class="sheet-btns">
          <button class="s-cancel" @click="showDiaryModal = false">取消</button>
          <button class="s-confirm diary-btn" :disabled="savingDiary" @click="doSaveDiary">{{ savingDiary ? '保存中…' : '保存日记' }}</button>
        </div>
      </div>
    </van-popup>

    <!-- Day detail -->
    <van-popup v-model:show="showDayDetail" round position="bottom" safe-area-inset-bottom :style="{maxHeight:'92vh',overflowY:'auto'}">
      <div class="sheet-inner">
        <div v-if="dayDetailLoading" class="detail-loading">
          <van-loading :color="lineColor" size="32px" />
          <p class="detail-loading-txt">加载中…</p>
        </div>
        <template v-else-if="dayDetail">
          <div class="detail-header">
            <div class="detail-date">{{ formatDayLabel(dayDetail.date) }}</div>
            <button class="detail-close" @click="showDayDetail = false">✕</button>
          </div>

          <div v-if="dayDetail.weight" class="detail-weight-pill" :class="{ partner: viewPartner }">
            ⚖️ <strong>{{ displayWeight(dayDetail.weight) }} {{ weightUnit === 'kg' ? 'kg' : '斤' }}</strong>
            <span v-if="dayDetail.weightNote" class="detail-weight-note">· {{ dayDetail.weightNote }}</span>
          </div>

          <template v-if="dayDetail.orders?.length">
            <div class="detail-section-label">{{ cfg.calEmojiCooking }} {{ cfg.calLabelCooking }}</div>
            <div v-for="order in dayDetail.orders" :key="order.id" class="order-block">
              <div class="order-block-head">
                <span class="ob-meal">{{ order.mealTypeName }}</span>
                <span class="ob-state" :class="'st'+order.state">{{ getStateName(order.state) }}</span>
              </div>
              <div class="ob-items">
                <span v-for="item in order.items" :key="item.dishName" class="ob-chip">{{ item.dishName }} ×{{ item.qty }}</span>
              </div>
              <div v-if="order.remark" class="ob-remark">📝 {{ order.remark }}</div>
              <div v-if="order.review" class="ob-review">
                <div class="rev-stars">{{ '★'.repeat(order.review.score) }}<span class="rev-empty-stars">{{ '★'.repeat(5 - order.review.score) }}</span></div>
                <div v-if="order.review.content" class="rev-text">"{{ order.review.content }}"</div>
                <div v-if="order.review.images?.length" class="rev-imgs">
                  <img v-for="(img, i) in order.review.images" :key="i" :src="img" class="rev-thumb" @click="previewImg(order.review.images, i)" />
                </div>
              </div>
            </div>
          </template>

          <template v-if="dayDetail.visits?.length">
            <div class="detail-section-label">{{ cfg.calEmojiDining }} {{ cfg.calLabelDining }}</div>
            <div v-for="v in dayDetail.visits" :key="v.id" class="visit-block">
              <div class="vb-head">
                <span class="vb-meal">{{ getMealTypeName(v.mealType) }}</span>
                <span class="vb-name">{{ v.restaurantName }}</span>
                <span v-if="v.score" class="vb-score">{{ '★'.repeat(Math.round(v.score)) }}</span>
                <button v-if="!viewPartner" class="vb-del" @click="confirmDeleteVisit(v, dayDetail.date)">✕</button>
              </div>
              <div v-if="v.content" class="vb-text">"{{ v.content }}"</div>
              <div v-if="v.imageUrls?.length" class="rev-imgs">
                <img v-for="(img, i) in v.imageUrls" :key="i" :src="img" class="rev-thumb" @click="previewImg(v.imageUrls, i)" />
              </div>
            </div>
            <button v-if="!viewPartner" class="more-btn" @click="openVisitForm(dayDetail.date)">+ 再添一条</button>
          </template>

          <template v-if="dayDetail.diary">
            <div class="detail-section-label">{{ cfg.calEmojiDiary }} {{ cfg.calLabelDiary }}</div>
            <div class="diary-block">
              <p class="diary-text">{{ dayDetail.diary.content }}</p>
              <div v-if="dayDetail.diary.imageUrls?.length" class="rev-imgs" style="margin-top:8px">
                <img v-for="(img, i) in dayDetail.diary.imageUrls" :key="i" :src="img" class="rev-thumb" @click="previewImg(dayDetail.diary.imageUrls, i)" />
              </div>
              <div v-if="!viewPartner" class="diary-actions">
                <button class="da-btn" @click="editDiary(dayDetail)">✏️ 编辑</button>
                <button class="da-btn del" @click="confirmDeleteDiary(dayDetail.diary, dayDetail.date)">🗑 删除</button>
              </div>
            </div>
          </template>

          <div v-if="!dayDetail.orders?.length && !dayDetail.visits?.length && !dayDetail.diary && !dayDetail.weight" class="detail-empty">这天还没有记录</div>

          <div v-if="!viewPartner" class="detail-add-row">
            <button class="dab dining" @click="openVisitForm(dayDetail.date); showDayDetail = false">{{ cfg.calEmojiDining }}<br><span>{{ cfg.calLabelDining }}</span></button>
            <button class="dab diary" @click="openDiaryForm(dayDetail.date); showDayDetail = false">{{ cfg.calEmojiDiary }}<br><span>{{ cfg.calLabelDiary }}</span></button>
            <button class="dab weight" @click="openWeightForDate(dayDetail.date); showDayDetail = false">⚖️<br><span>体重</span></button>
          </div>

          <div class="sheet-btns" style="margin-top:12px">
            <button class="s-confirm" style="flex:1" @click="showDayDetail = false">关闭</button>
          </div>
        </template>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { showImagePreview, showToast, showConfirmDialog } from 'vant'
import { useLayoutConfigStore } from '../../../stores/layoutConfig.js'
import {
  getMyProfile, updateMyProfile, uploadAvatar,
  getWeightRecords, saveWeight, deleteWeight,
  getCalendar, getDayDetail,
  getPartnerProfile, getPartnerWeight, getPartnerCalendar, getPartnerDayDetail
} from '../../../api/orderProfile.js'
import { saveVisit, deleteVisit, saveDiary, deleteDiary, uploadLifePhoto } from '../../../api/orderLifeRecord.js'
import { prepareLifePhoto } from '../../../utils/imageUtils.js'

const layoutStore = useLayoutConfigStore()
const cfg = computed(() => layoutStore.config)

const viewPartner = ref(false)
const myProfile = ref({ nickname: '', avatarUrl: '', height: null, bio: '', currentWeight: null, currentWeightDate: null })
const partnerProfile = ref({})
const myWeights = ref([])
const partnerWeights = ref([])
const calendarDays = ref([])
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth() + 1)
const todayStr = new Date().toISOString().split('T')[0]

const showEditModal = ref(false)
const showWeightModal = ref(false)
const showVisitModal = ref(false)
const showDiaryModal = ref(false)
const showDayDetail = ref(false)
const dayDetailLoading = ref(false)
const saving = ref(false)
const savingWeight = ref(false)
const savingVisit = ref(false)
const savingDiary = ref(false)
const avatarInputRef = ref(null)
const tappedWeightIdx = ref(null)
const selectedCalDate = ref(null)
const dayDetail = ref(null)

// Weight unit
const weightUnit = ref(localStorage.getItem('order_weight_unit') || 'kg')
function toggleWeightUnit() {
  weightUnit.value = weightUnit.value === 'kg' ? 'jin' : 'kg'
  localStorage.setItem('order_weight_unit', weightUnit.value)
}
function displayWeight(kg) {
  if (kg == null) return null
  const v = parseFloat(kg)
  return weightUnit.value === 'jin' ? (v * 2).toFixed(1) : v.toFixed(1)
}

// Weight drag slider
const weightDisplayVal = ref(60)
const isWeightDragging = ref(false)
watch(weightUnit, () => {
  const kg = parseFloat(weightForm.value.weight) || 0
  weightDisplayVal.value = weightUnit.value === 'jin' ? parseFloat((kg * 2).toFixed(1)) : parseFloat(kg.toFixed(1))
})
function adjustWeight(delta) {
  const newVal = Math.max(20, Math.min(300, Math.round((weightDisplayVal.value + delta) * 10) / 10))
  weightDisplayVal.value = newVal
  weightForm.value.weight = (weightUnit.value === 'jin' ? newVal / 2 : newVal).toFixed(1)
}
function startWeightDrag(e) {
  isWeightDragging.value = true
  const startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX
  const startVal = weightDisplayVal.value
  const onMove = (ev) => {
    const cx = ev.type === 'touchmove' ? ev.touches[0].clientX : ev.clientX
    const delta = (cx - startX) / 8 * 0.1
    const newVal = Math.max(20, Math.min(300, Math.round((startVal + delta) * 10) / 10))
    weightDisplayVal.value = newVal
    weightForm.value.weight = (weightUnit.value === 'jin' ? newVal / 2 : newVal).toFixed(1)
  }
  const onEnd = () => {
    isWeightDragging.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('mouseup', onEnd)
    document.removeEventListener('touchend', onEnd)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('touchmove', onMove, { passive: true })
  document.addEventListener('mouseup', onEnd)
  document.addEventListener('touchend', onEnd)
}

const editForm = ref({ nickname: '', height: '', bio: '' })
const weightForm = ref({ recordDate: todayStr, weight: '60', note: '' })
const visitForm = ref({ visitDate: todayStr, mealType: 1, restaurantName: '', score: 5, content: '' })
const diaryForm = ref({ diaryDate: todayStr, content: '' })
const visitPhotoStage = ref([])
const diaryPhotoStage = ref([])
const visitPhotoPreviews = computed(() => visitPhotoStage.value.map(p => p.previewUrl))
const diaryPhotoPreviews = computed(() => diaryPhotoStage.value.map(p => p.previewUrl))

// Date strip: last 7 days
const dateStripDays = computed(() => {
  const today = new Date()
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const str = d.toISOString().split('T')[0]
    days.push({ str, day: d.getDate(), weekday: ['日','一','二','三','四','五','六'][d.getDay()] })
  }
  return days
})

const currentProfile = computed(() => viewPartner.value ? partnerProfile.value : myProfile.value)
const currentWeights = computed(() => viewPartner.value ? partnerWeights.value : myWeights.value)
const lineColor = computed(() => viewPartner.value ? '#5b8af0' : '#c96b7e')

// Chart
const chartW = 320, chartH = 140, padL = 30, padR = 10, padT = 24, padB = 18
const chartPoints = computed(() => {
  const recs = currentWeights.value
  if (recs.length < 2) return []
  const vals = recs.map(r => parseFloat(r.weight))
  const minV = Math.min(...vals), maxV = Math.max(...vals), range = maxV - minV || 1
  return vals.map((v, i) => ({
    x: padL + (i / (recs.length - 1)) * (chartW - padL - padR),
    y: padT + (1 - (v - minV) / range) * (chartH - padT - padB)
  }))
})
const chartMinVal = computed(() => {
  if (!currentWeights.value.length) return ''
  return displayWeight(Math.min(...currentWeights.value.map(r => parseFloat(r.weight))))
})
const chartMaxVal = computed(() => {
  if (!currentWeights.value.length) return ''
  return displayWeight(Math.max(...currentWeights.value.map(r => parseFloat(r.weight))))
})
const chartLinePath = computed(() => chartPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' '))
const chartAreaPath = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  const bot = chartH - padB
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1].x},${bot} L${pts[0].x},${bot} Z`
})
const chartLabelIndices = computed(() => {
  const n = chartPoints.value.length
  if (n === 0) return []
  if (n <= 6) return Array.from({ length: n }, (_, i) => i)
  const step = Math.ceil(n / 6)
  const indices = []
  for (let i = 0; i < n; i += step) indices.push(i)
  if (indices[indices.length - 1] !== n - 1) indices.push(n - 1)
  return indices
})
const chartLabelRecords = computed(() => {
  const n = currentWeights.value.length
  if (n <= 4) return currentWeights.value
  return [0, Math.floor(n / 3), Math.floor(2 * n / 3), n - 1].map(i => currentWeights.value[i])
})
const calStartBlank = computed(() => new Date(calYear.value, calMonth.value - 1, 1).getDay())

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

async function loadSelf() {
  try { myProfile.value = await getMyProfile() } catch {}
  try { myWeights.value = await getWeightRecords(90) } catch {}
}
async function loadPartner() {
  try { partnerProfile.value = await getPartnerProfile() || {} } catch {}
  try { partnerWeights.value = await getPartnerWeight(90) } catch {}
}
async function loadCalendar() {
  try {
    calendarDays.value = viewPartner.value
      ? await getPartnerCalendar(calYear.value, calMonth.value)
      : await getCalendar(calYear.value, calMonth.value)
  } catch {}
}

onMounted(() => { loadSelf(); loadPartner(); loadCalendar() })

function switchToPartner() { viewPartner.value = true; tappedWeightIdx.value = null; selectedCalDate.value = null; loadCalendar() }
function switchToSelf() { viewPartner.value = false; tappedWeightIdx.value = null; selectedCalDate.value = null; loadCalendar() }

function formatDateShort(d) {
  if (!d) return ''
  const [, m, day] = d.split('-')
  return `${+m}月${+day}日`
}
function formatDayLabel(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  const wd = ['日','一','二','三','四','五','六'][new Date(d).getDay()]
  return `${y}年${+m}月${+day}日 星期${wd}`
}
function getMealTypeName(t) { return ['早饭','午饭','晚饭'][t] ?? '其他' }
function getStateName(s) { return { 0: '待接单', 1: '已接单', 2: '已完成', 3: '已取消' }[s] ?? '' }

function changeMonth(delta) {
  let m = calMonth.value + delta, y = calYear.value
  if (m < 1) { m = 12; y-- }
  if (m > 12) { m = 1; y++ }
  calMonth.value = m; calYear.value = y; loadCalendar()
}

async function selectCalDay(day) {
  selectedCalDate.value = day.date
  const hasData = day.hasOrder || day.hasVisit || day.hasDiary || day.weight != null
  if (!hasData) return
  dayDetail.value = null
  dayDetailLoading.value = true
  showDayDetail.value = true
  try {
    dayDetail.value = viewPartner.value ? await getPartnerDayDetail(day.date) : await getDayDetail(day.date)
  } catch (e) {
    showToast(e.message || '加载失败')
    showDayDetail.value = false
  } finally {
    dayDetailLoading.value = false
  }
}

function initWeightDisplay() {
  const lastKg = myWeights.value.length > 0
    ? parseFloat(myWeights.value[myWeights.value.length - 1].weight)
    : 60
  weightDisplayVal.value = weightUnit.value === 'jin' ? parseFloat((lastKg * 2).toFixed(1)) : parseFloat(lastKg.toFixed(1))
  return lastKg.toFixed(1)
}

function openWeightInput() {
  const kg = initWeightDisplay()
  weightForm.value = { recordDate: todayStr, weight: kg, note: '' }
  showWeightModal.value = true
}
function openWeightForDate(d) {
  const kg = initWeightDisplay()
  weightForm.value = { recordDate: d, weight: kg, note: '' }
  showWeightModal.value = true
}

async function doSaveWeight() {
  if (!weightForm.value.weight) { showToast('请调整体重数值'); return }
  savingWeight.value = true
  try {
    await saveWeight({ recordDate: weightForm.value.recordDate, weight: parseFloat(weightForm.value.weight), note: weightForm.value.note || null })
    showWeightModal.value = false; showToast('记录成功 ✓')
    await Promise.all([loadSelf(), loadCalendar()])
  } catch (e) { showToast(e.message) } finally { savingWeight.value = false }
}

async function confirmDeleteWeight(r) {
  try {
    await showConfirmDialog({ title: '删除体重记录', message: `确认删除 ${r.recordDate} 的记录？` })
    await deleteWeight(r.id); showToast('已删除')
    await Promise.all([loadSelf(), loadCalendar()])
  } catch {}
}

function triggerAvatarUpload() { avatarInputRef.value?.click() }
async function onAvatarChange(e) {
  const file = e.target.files?.[0]; if (!file) return
  const resized = await resizeTo800(file)
  const fd = new FormData(); fd.append('file', resized, 'avatar.jpg')
  try {
    await uploadAvatar(fd)
    await loadSelf()
    showToast('头像已更新 ✓')
  } catch (err) { showToast(err.message) }
  e.target.value = ''
}
function resizeTo800(file) {
  return new Promise(resolve => {
    const img = new Image(), url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const s = Math.min(img.width, img.height), canvas = document.createElement('canvas')
      canvas.width = canvas.height = 800
      canvas.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 800, 800)
      canvas.toBlob(resolve, 'image/jpeg', 0.9)
    }; img.src = url
  })
}

function openEdit() {
  editForm.value = { nickname: myProfile.value.nickname || '', height: myProfile.value.height || '', bio: myProfile.value.bio || '' }
  showEditModal.value = true
}
async function saveProfile() {
  saving.value = true
  try {
    await updateMyProfile({ nickname: editForm.value.nickname || null, height: editForm.value.height ? parseFloat(editForm.value.height) : null, bio: editForm.value.bio || null })
    showEditModal.value = false; showToast('保存成功 ✓'); await loadSelf()
  } catch (e) { showToast(e.message) } finally { saving.value = false }
}

function openVisitForm(date) {
  visitForm.value = { visitDate: date || todayStr, mealType: 1, restaurantName: '', score: 5, content: '' }
  visitPhotoStage.value = []; showVisitModal.value = true
}
async function onVisitPhotoChange(e) {
  const file = e.target.files?.[0]; if (!file || visitPhotoStage.value.length >= 3) return
  const processed = await prepareLifePhoto(file)
  visitPhotoStage.value.push({ file: processed, previewUrl: URL.createObjectURL(processed) })
  e.target.value = ''
}
function removeVisitPhoto(i) { URL.revokeObjectURL(visitPhotoStage.value[i].previewUrl); visitPhotoStage.value.splice(i, 1) }
async function doSaveVisit() {
  if (!visitForm.value.restaurantName) { showToast('请输入餐厅名称'); return }
  savingVisit.value = true
  try {
    const fileIds = []
    for (const s of visitPhotoStage.value) { const r = await uploadLifePhoto(s.file); fileIds.push(r.id) }
    await saveVisit({ ...visitForm.value, fileIds })
    showVisitModal.value = false; showToast('记录成功 ✓'); await loadCalendar()
  } catch (e) { showToast(e.message) } finally { savingVisit.value = false }
}
async function confirmDeleteVisit(v, date) {
  try {
    await showConfirmDialog({ title: '删除记录', message: `确认删除「${v.restaurantName}」？` })
    await deleteVisit(v.id); showToast('已删除')
    dayDetail.value = await getDayDetail(date); await loadCalendar()
  } catch {}
}

function openDiaryForm(date) {
  diaryForm.value = { diaryDate: date || todayStr, content: '' }
  diaryPhotoStage.value = []; showDiaryModal.value = true
}
function editDiary(detail) {
  diaryForm.value = { diaryDate: detail.date, content: detail.diary.content || '' }
  diaryPhotoStage.value = []; showDayDetail.value = false; showDiaryModal.value = true
}
async function onDiaryPhotoChange(e) {
  const file = e.target.files?.[0]; if (!file || diaryPhotoStage.value.length >= 3) return
  const processed = await prepareLifePhoto(file)
  diaryPhotoStage.value.push({ file: processed, previewUrl: URL.createObjectURL(processed) })
  e.target.value = ''
}
function removeDiaryPhoto(i) { URL.revokeObjectURL(diaryPhotoStage.value[i].previewUrl); diaryPhotoStage.value.splice(i, 1) }
async function doSaveDiary() {
  if (!diaryForm.value.content && diaryPhotoStage.value.length === 0) { showToast('请写点内容或添加图片'); return }
  savingDiary.value = true
  try {
    const fileIds = []
    for (const s of diaryPhotoStage.value) { const r = await uploadLifePhoto(s.file); fileIds.push(r.id) }
    await saveDiary({ ...diaryForm.value, fileIds })
    showDiaryModal.value = false; showToast('日记已保存 ✓'); await loadCalendar()
  } catch (e) { showToast(e.message) } finally { savingDiary.value = false }
}
async function confirmDeleteDiary(diary, date) {
  try {
    await showConfirmDialog({ title: '删除日记', message: '确认删除这篇日记？' })
    await deleteDiary(diary.id); showToast('已删除')
    dayDetail.value = await getDayDetail(date); await loadCalendar()
  } catch {}
}

function previewImg(imgs, idx) { showImagePreview({ images: imgs, startPosition: idx }) }
</script>

<style scoped>
/* ─── Page ─────────────────────────────────── */
.profile-page { min-height: 100vh; background: #f2f2f7; padding-bottom: 100px; }

/* ─── Hero banner ───────────────────────────── */
.hero-banner {
  position: relative; height: 150px;
  background: linear-gradient(135deg, #e8a0b0 0%, #c96b7e 55%, #a84d65 100%);
  transition: background 0.4s;
}
.hero-banner.partner {
  background: linear-gradient(135deg, #93c5fd 0%, #5b8af0 55%, #3b65cc 100%);
}
.banner-inner-clip {
  position: absolute; inset: 0; overflow: hidden;
}
.banner-bg {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 30% 60%, rgba(255,255,255,0.12) 0%, transparent 60%);
}
.banner-deco { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.08); }
.d1 { width: 120px; height: 120px; top: -30px; right: -20px; }
.d2 { width: 80px; height: 80px; top: 20px; right: 60px; background: rgba(255,255,255,0.06); }
.d3 { width: 60px; height: 60px; bottom: -10px; left: 40px; }

/* 看看TA button */
.peek-btn {
  position: absolute; top: 14px; right: 14px;
  background: rgba(255,255,255,0.22); backdrop-filter: blur(8px);
  border: 1.5px solid rgba(255,255,255,0.4); color: #fff;
  border-radius: 20px; padding: 6px 14px;
  font-size: 12px; font-weight: 700; cursor: pointer; z-index: 2;
  transition: background 0.15s;
}
.peek-btn.back { background: rgba(255,255,255,0.28); }
.peek-btn:active { background: rgba(255,255,255,0.4); }

.avatar-ring {
  position: absolute; bottom: -36px; left: 20px;
  width: 88px; height: 88px; border-radius: 50%;
  box-shadow: 0 0 0 4px #fff, 0 4px 20px rgba(0,0,0,0.2);
  overflow: hidden; z-index: 2;
}
.avatar-ring.clickable { cursor: pointer; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, #d97a90, #c96b7e);
  color: #fff; font-size: 32px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.avatar-edit-badge {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; opacity: 0; transition: opacity 0.2s;
}
.avatar-ring.clickable:active .avatar-edit-badge { opacity: 1; }

/* ─── Profile card ──────────────────────────── */
.profile-card {
  background: #fff; margin: 0 12px 12px; border-radius: 0 0 20px 20px;
  padding: 48px 16px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.profile-name-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.profile-name { font-size: 20px; font-weight: 800; color: #1c1c1e; display: flex; align-items: center; gap: 8px; }
.ta-badge { font-size: 11px; background: #eff6ff; color: #5b8af0; border-radius: 8px; padding: 2px 8px; font-weight: 700; }
.edit-btn {
  background: #fef4f5; border: 1.5px solid rgba(201,107,126,0.25);
  color: #c96b7e; border-radius: 20px; padding: 5px 14px;
  font-size: 12px; font-weight: 700; cursor: pointer;
}
.edit-btn:active { background: #ffe4ea; }
.profile-bio { font-size: 13px; color: #6d6d72; line-height: 1.5; margin-bottom: 12px; }
.stats-row { display: flex; align-items: center; margin-top: 10px; }
.stat-pill { flex: 1; text-align: center; }
.stat-pill.clickable { cursor: pointer; }
.stat-num { font-size: 22px; font-weight: 800; color: #1c1c1e; line-height: 1.2; }
.weight-num { color: #c96b7e; }
.weight-partner { color: #5b8af0; }
.stat-unit { font-size: 11px; color: #aeaeb2; margin-top: 2px; }
.unit-tag {
  display: inline-block; background: #fef4f5; color: #c96b7e;
  border-radius: 6px; padding: 1px 5px; font-size: 10px; font-weight: 700;
  cursor: pointer; border: 1px solid rgba(201,107,126,0.2);
}
.unit-tag:active { background: #ffe4ea; }
.unit-tag-small {
  font-size: 12px; color: #c96b7e; font-weight: 600; cursor: pointer;
  border: 1px solid rgba(201,107,126,0.2); border-radius: 8px; padding: 2px 8px;
  background: #fef4f5;
}
.weight-since { font-size: 10px; color: #c8c8cc; }
.stat-sep { width: 1px; height: 36px; background: #e5e5ea; margin: 0 12px; flex-shrink: 0; }

/* ─── Sections ──────────────────────────────── */
.section-card {
  background: #fff; margin: 0 12px 12px; border-radius: 20px;
  padding: 14px 14px 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.section-title { font-size: 15px; font-weight: 700; color: #1c1c1e; }
.section-action { font-size: 13px; color: #c96b7e; font-weight: 700; cursor: pointer; }

/* ─── Chart ─────────────────────────────────── */
.chart-wrap { width: 100%; }
.weight-chart { width: 100%; height: 140px; display: block; overflow: visible; }
.chart-labels { display: flex; justify-content: space-between; font-size: 10px; color: #c8c8cc; margin-top: 4px; padding: 0 6px; }
.empty-chart { text-align: center; padding: 12px 0 4px; }
.empty-icon { font-size: 32px; margin-bottom: 4px; }
.solo-weight { font-size: 38px; font-weight: 800; line-height: 1.1; }
.solo-unit { font-size: 18px; font-weight: 500; }
.solo-date { font-size: 12px; color: #aeaeb2; margin-top: 2px; }
.empty-tip { font-size: 13px; color: #aeaeb2; margin-top: 6px; }

/* ─── Calendar ──────────────────────────────── */
.cal-legend { display: flex; gap: 16px; margin-bottom: 12px; }
.legend-item { font-size: 12px; color: #6d6d72; display: flex; align-items: center; gap: 4px; }
.legend-emoji { font-size: 14px; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
.cal-weekday { text-align: center; font-size: 11px; color: #aeaeb2; font-weight: 600; padding: 4px 0 6px; }
.cal-cell-empty { min-height: 58px; }
.cal-cell {
  min-height: 58px; border-radius: 12px;
  display: flex; flex-direction: column; align-items: center;
  padding: 5px 2px 4px; cursor: pointer;
  transition: background 0.12s, transform 0.1s;
}
.cal-cell.active { background: rgba(201,107,126,0.07); }
.cal-cell.active.partner { background: rgba(91,138,240,0.07); }
.cal-cell.selected { background: #ffe0e8; box-shadow: 0 0 0 1.5px #c96b7e inset; }
.cal-cell.selected.partner { background: #dfeeff; box-shadow: 0 0 0 1.5px #5b8af0 inset; }
.cal-cell:active { transform: scale(0.93); }
.cal-num { font-size: 13px; color: #3a3a3c; font-weight: 500; line-height: 1.3; }
.today-num {
  background: #c96b7e; color: #fff; border-radius: 50%;
  width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; line-height: 1;
}
.today-num-partner {
  background: #5b8af0; color: #fff; border-radius: 50%;
  width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; line-height: 1;
}
.cal-emojis { display: flex; flex-wrap: wrap; justify-content: center; gap: 0; margin-top: 2px; min-height: 14px; font-size: 10px; line-height: 1.2; }
.cal-kg { font-size: 8.5px; color: #c96b7e; font-weight: 700; background: #fef4f5; border-radius: 4px; padding: 1px 3px; margin-top: 2px; }
.cal-kg.partner-kg { color: #5b8af0; background: #eff6ff; }
.month-nav { display: flex; align-items: center; gap: 4px; }
.month-btn { background: none; border: none; font-size: 22px; color: #c96b7e; cursor: pointer; padding: 0 4px; line-height: 1; }
.month-label { font-size: 13px; font-weight: 600; color: #1c1c1e; min-width: 72px; text-align: center; }

/* ─── Quick bar ─────────────────────────────── */
.quick-bar {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; margin: 0 12px 12px; border-radius: 16px;
  padding: 10px 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.07);
}
.quick-date { font-size: 12px; color: #aeaeb2; }
.quick-btns { display: flex; gap: 8px; }
.qb {
  border: none; border-radius: 12px; padding: 7px 10px; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.qb-icon { font-size: 16px; line-height: 1; }
.qb-lbl { font-size: 10px; font-weight: 600; }
.qb.dining { background: #fff8ed; color: #d97706; }
.qb.diary { background: #eff6ff; color: #3b82f6; }
.qb.weight { background: #f0fdf4; color: #16a34a; }
.qb:active { opacity: 0.7; transform: scale(0.9); }
.slide-up-enter-active { transition: all 0.2s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(10px); }

/* ─── Weight list ───────────────────────────── */
.weight-list { display: flex; flex-direction: column; gap: 6px; }
.wt-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; background: #f9f9fb; border-radius: 12px;
}
.wt-left { display: flex; flex-direction: column; gap: 2px; }
.wt-date { font-size: 13px; color: #3a3a3c; font-weight: 500; }
.wt-note { font-size: 11px; color: #aeaeb2; }
.wt-right { display: flex; align-items: center; gap: 10px; }
.wt-val { font-size: 18px; font-weight: 800; color: #c96b7e; }
.wt-unit { font-size: 12px; font-weight: 500; }
.wt-del { background: none; border: none; color: #c8c8cc; font-size: 14px; cursor: pointer; padding: 2px 4px; }
.wt-del:active { color: #ff3b30; }

/* ─── Sheets ────────────────────────────────── */
.sheet-handle { width: 36px; height: 4px; background: #e5e5ea; border-radius: 2px; margin: 10px auto 0; }
.sheet-inner { padding: 16px 16px 24px; }
.sheet-title { font-size: 18px; font-weight: 800; color: #1c1c1e; margin-bottom: 20px; }
.form-field { margin-bottom: 16px; }
.form-label { font-size: 11px; font-weight: 700; color: #aeaeb2; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 7px; display: flex; align-items: center; gap: 6px; }
.form-hint { font-size: 10px; color: #c8c8cc; text-transform: none; letter-spacing: 0; font-weight: 400; }
.form-input {
  width: 100%; padding: 13px 14px; border-radius: 13px; border: none;
  background: #f7f7f9; font-size: 15px; outline: none; color: #1c1c1e; box-sizing: border-box;
  transition: box-shadow 0.15s, background 0.15s;
}
.form-input:focus { background: #fff; box-shadow: 0 0 0 2px #c96b7e; }
.form-textarea {
  width: 100%; padding: 13px 14px; border-radius: 13px; border: none;
  background: #f7f7f9; font-size: 15px; outline: none; color: #1c1c1e; box-sizing: border-box;
  resize: none; font-family: inherit; line-height: 1.5;
  transition: box-shadow 0.15s, background 0.15s;
}
.form-textarea:focus { background: #fff; box-shadow: 0 0 0 2px #c96b7e; }
.diary-ta { min-height: 140px; }
.sheet-btns { display: flex; gap: 10px; margin-top: 20px; }
.s-cancel { flex: 1; padding: 14px; background: #f2f2f7; border: none; border-radius: 14px; font-size: 15px; font-weight: 600; color: #6d6d72; cursor: pointer; }
.s-cancel:active { background: #e5e5ea; }
.s-confirm { flex: 2; padding: 14px; background: #c96b7e; border: none; border-radius: 14px; font-size: 15px; font-weight: 700; color: #fff; cursor: pointer; box-shadow: 0 4px 14px rgba(201,107,126,0.32); }
.s-confirm.dining { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 14px rgba(217,119,6,0.28); }
.s-confirm.diary-btn { background: linear-gradient(135deg, #60a5fa, #3b82f6); box-shadow: 0 4px 14px rgba(59,130,246,0.28); }
.s-confirm:disabled { opacity: 0.5; }
.s-confirm:active { opacity: 0.85; }

/* ─── Weight slider ─────────────────────────── */
.unit-toggle-btn {
  margin-left: auto; background: #fef4f5; border: 1px solid rgba(201,107,126,0.25);
  color: #c96b7e; border-radius: 10px; padding: 3px 10px;
  font-size: 11px; font-weight: 700; cursor: pointer;
}
.unit-toggle-btn:active { background: #ffe4ea; }
.weight-slider-wrap {
  display: flex; align-items: center;
  background: #f7f7f9; border-radius: 16px; overflow: hidden;
  user-select: none; touch-action: none; cursor: ew-resize;
  transition: box-shadow 0.15s;
}
.weight-slider-wrap.dragging { box-shadow: 0 0 0 2px #c96b7e; background: #fff; }
.ws-arrow {
  flex-shrink: 0; width: 48px; height: 64px; background: none; border: none;
  font-size: 28px; color: #c96b7e; cursor: pointer; font-weight: 300;
  display: flex; align-items: center; justify-content: center;
}
.ws-arrow:active { background: rgba(201,107,126,0.08); }
.ws-display {
  flex: 1; text-align: center; padding: 8px 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: none;
}
.ws-val { font-size: 36px; font-weight: 800; color: #1c1c1e; line-height: 1.1; }
.ws-unit-lbl { font-size: 13px; color: #aeaeb2; font-weight: 600; margin-top: 2px; }
.ws-hint { text-align: center; font-size: 11px; color: #c8c8cc; margin-top: 8px; }

/* ─── Date strip ────────────────────────────── */
.date-strip-wrap {
  padding: 12px 16px 10px;
  background: #fff;
  border-bottom: 0.5px solid #f2f2f7;
}
.date-strip {
  display: flex; gap: 6px;
  overflow-x: auto; scrollbar-width: none;
}
.date-strip::-webkit-scrollbar { display: none; }
.date-strip-item {
  flex-shrink: 0; min-width: 40px; text-align: center;
  padding: 7px 6px; border-radius: 12px; cursor: pointer;
  transition: all 0.15s;
}
.date-strip-item.active { background: #c96b7e; }
.ds-weekday { font-size: 10px; color: #aeaeb2; line-height: 1; margin-bottom: 4px; }
.date-strip-item.active .ds-weekday { color: rgba(255,255,255,0.75); }
.ds-day { font-size: 18px; font-weight: 700; color: #1c1c1e; line-height: 1; }
.date-strip-item.active .ds-day { color: #fff; }
.date-strip-item:not(.active):active { background: #fef4f5; }

.seg-ctrl { display: flex; background: #f2f2f7; border-radius: 12px; padding: 3px; gap: 3px; }
.seg-btn { flex: 1; padding: 8px; border: none; border-radius: 9px; background: transparent; font-size: 13px; font-weight: 600; color: #6d6d72; cursor: pointer; transition: all 0.15s; }
.seg-btn.on { background: #fff; color: #c96b7e; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.stars { display: flex; gap: 6px; }
.star { font-size: 28px; color: #e5e5ea; cursor: pointer; transition: color 0.1s, transform 0.1s; line-height: 1; }
.star.lit { color: #f59e0b; }
.star:active { transform: scale(1.2); }
.photo-grid { display: flex; gap: 10px; flex-wrap: wrap; }
.photo-slot { position: relative; width: 80px; height: 80px; border-radius: 12px; overflow: visible; }
.photo-img { width: 80px; height: 80px; object-fit: cover; border-radius: 12px; }
.photo-x { position: absolute; top: -7px; right: -7px; width: 22px; height: 22px; background: #ff3b30; color: #fff; border: none; border-radius: 50%; font-size: 11px; cursor: pointer; line-height: 22px; text-align: center; padding: 0; }
.photo-add { width: 80px; height: 80px; border: 2px dashed #d1d1d6; border-radius: 12px; background: #f9f9fb; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.photo-add-icon { font-size: 30px; color: #c8c8cc; line-height: 1; }
.photo-add:active { background: #f2f2f7; }

/* ─── Day detail ─────────────────────────────── */
.detail-loading { display: flex; flex-direction: column; align-items: center; padding: 40px 0 20px; }
.detail-loading-txt { font-size: 13px; color: #aeaeb2; margin-top: 12px; }
.detail-header { display: flex; align-items: center; justify-content: space-between; padding: 4px 0 16px; }
.detail-date { font-size: 16px; font-weight: 700; color: #1c1c1e; }
.detail-close { background: #f2f2f7; border: none; border-radius: 50%; width: 28px; height: 28px; font-size: 13px; cursor: pointer; color: #6d6d72; }
.detail-weight-pill {
  display: inline-flex; align-items: center; gap: 4px;
  background: linear-gradient(135deg, #fff0f3, #ffe4ea);
  color: #c96b7e; border-radius: 20px; padding: 6px 14px;
  font-size: 13px; margin-bottom: 14px;
}
.detail-weight-pill.partner { background: linear-gradient(135deg, #eff6ff, #dbeafe); color: #5b8af0; }
.detail-weight-note { color: #d49ea8; font-size: 12px; }
.detail-section-label { font-size: 12px; font-weight: 800; color: #aeaeb2; text-transform: uppercase; letter-spacing: 0.5px; margin: 14px 0 8px; }
.detail-empty { text-align: center; color: #c8c8cc; font-size: 14px; padding: 24px 0; }

.order-block { background: #f9f9fb; border-radius: 16px; padding: 12px; margin-bottom: 8px; }
.order-block-head { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
.ob-meal { font-size: 12px; font-weight: 700; background: #fef4f5; color: #c96b7e; border-radius: 8px; padding: 3px 9px; }
.ob-state { font-size: 11px; color: #aeaeb2; }
.st2 { color: #34c759; }
.st3 { color: #ff3b30; }
.ob-items { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 6px; }
.ob-chip { font-size: 12px; background: #fff; border: 1px solid #e5e5ea; border-radius: 8px; padding: 3px 8px; color: #3a3a3c; }
.ob-remark { font-size: 12px; color: #6d6d72; margin-top: 4px; }
.ob-review { border-top: 1px solid #f0f0f5; margin-top: 10px; padding-top: 10px; }
.rev-stars { font-size: 16px; color: #f59e0b; margin-bottom: 4px; }
.rev-empty-stars { color: #e5e5ea; }
.rev-text { font-size: 13px; color: #6d6d72; font-style: italic; margin-bottom: 6px; line-height: 1.5; }
.rev-imgs { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
.rev-thumb { width: 64px; height: 64px; object-fit: cover; border-radius: 10px; cursor: pointer; }
.visit-block { background: linear-gradient(135deg, #fff8ed, #fffbf0); border-radius: 16px; padding: 12px; margin-bottom: 8px; }
.vb-head { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; }
.vb-meal { font-size: 11px; font-weight: 700; background: #fef3c7; color: #d97706; border-radius: 7px; padding: 2px 8px; }
.vb-name { font-size: 14px; font-weight: 700; color: #1c1c1e; flex: 1; }
.vb-score { font-size: 13px; color: #f59e0b; }
.vb-del { background: none; border: none; color: #d1d1d6; font-size: 13px; cursor: pointer; padding: 2px 4px; }
.vb-del:active { color: #ff3b30; }
.vb-text { font-size: 13px; color: #6d6d72; font-style: italic; margin-bottom: 6px; line-height: 1.5; }
.diary-block { background: linear-gradient(135deg, #eff6ff, #f0f8ff); border-radius: 16px; padding: 14px; margin-bottom: 8px; }
.diary-text { font-size: 14px; color: #1c1c1e; line-height: 1.7; white-space: pre-wrap; margin: 0; }
.diary-actions { display: flex; gap: 8px; margin-top: 10px; }
.da-btn { background: #fff; border: none; border-radius: 10px; padding: 6px 14px; font-size: 12px; font-weight: 600; color: #3b82f6; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.da-btn.del { color: #ff3b30; }
.more-btn { background: none; border: 1.5px dashed #f59e0b; color: #d97706; border-radius: 10px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; margin: 2px 0 6px; }
.detail-add-row { display: flex; gap: 10px; margin-top: 20px; }
.dab { flex: 1; padding: 12px 4px 10px; border: none; border-radius: 16px; cursor: pointer; font-size: 18px; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.dab span { font-size: 11px; font-weight: 600; }
.dab.dining { background: #fff8ed; color: #d97706; }
.dab.diary { background: #eff6ff; color: #3b82f6; }
.dab.weight { background: #f0fdf4; color: #16a34a; }
.dab:active { opacity: 0.7; transform: scale(0.95); }
</style>
