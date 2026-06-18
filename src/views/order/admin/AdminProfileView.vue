<template>
  <div class="profile-page">
    <!-- Hero banner -->
    <div class="hero-banner" :class="{ partner: viewPartner }">
      <div class="banner-inner-clip">
        <img v-if="currentProfile.bannerUrl" class="banner-img" :src="absImgUrl(currentProfile.bannerUrl)" />
        <div v-else class="banner-bg"></div>
        <div class="banner-deco d1"></div>
        <div class="banner-deco d2"></div>
        <div class="banner-deco d3"></div>
      </div>

      <!-- 看看TA / 回到我的 -->
      <button v-if="!viewPartner" class="peek-btn" @click="switchToPartner">看看TA 👀</button>
      <button v-else class="peek-btn back" @click="switchToSelf">← 我的</button>
      <input ref="bannerInputRef" type="file" accept="image/*" style="display:none" @change="onBannerChange" />

      <div class="hero-profile-row">
        <div class="avatar-ring" :class="{ clickable: !viewPartner }" @click="!viewPartner && triggerAvatarUpload()">
          <img v-if="currentProfile.avatarUrl" :src="absImgUrl(currentProfile.avatarUrl)" class="avatar-img" />
          <div v-else class="avatar-placeholder">{{ (currentProfile.nickname || '?')[0] }}</div>
          <div v-if="!viewPartner" class="avatar-edit-badge">📷</div>
        </div>
        <input v-if="!viewPartner" ref="avatarInputRef" type="file" accept="image/*" style="display:none" @change="onAvatarChange" />
        <div class="hero-profile-copy">
          <div class="profile-name">
            {{ currentProfile.nickname || '未设置昵称' }}
            <span v-if="viewPartner" class="ta-badge">TA</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile summary -->
    <div class="profile-card" :class="{ partner: viewPartner }">
      <div class="profile-info-row">
        <div class="profile-signature" :class="{ muted: !currentProfile.bio }">
          {{ currentProfile.bio || '还没有写签名' }}
        </div>
        <span v-if="currentProfile.birthday" class="profile-birthday">🎂 {{ formatBirthday(currentProfile.birthday) }}</span>
        <button v-if="!viewPartner" class="edit-btn" @click="openEdit">编辑资料</button>
      </div>
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
        <div class="cal-header-right">
          <button v-if="!viewPartner" class="cal-add-today-btn" @click="showTodaySheet = true">＋ 今日</button>
          <div class="month-nav">
            <button class="month-btn" @click="changeMonth(-1)">‹</button>
            <span class="month-label clickable" @click="openMonthPicker">{{ calYear }}年{{ calMonth }}月</span>
            <button class="month-btn" @click="changeMonth(1)">›</button>
          </div>
        </div>
      </div>
      <div class="cal-legend">
        <span class="legend-item"><span class="legend-emoji">{{ cfg.calEmojiCooking }}</span>{{ cfg.calLabelCooking }}</span>
        <span class="legend-item"><span class="legend-emoji">{{ cfg.calEmojiDining }}</span>{{ cfg.calLabelDining }}</span>
        <span class="legend-item"><span class="legend-emoji">{{ cfg.calEmojiDiary }}</span>{{ cfg.calLabelDiary }}</span>
      </div>
      <div class="cal-weekday-row">
        <div class="cal-weekday" v-for="(d, i) in ['日','一','二','三','四','五','六']" :key="d"
             :class="{ 'wd-sun': i === 0, 'wd-sat': i === 6 }">{{ d }}</div>
      </div>
      <div class="cal-slide-wrap" @touchstart.passive="onCalTouchStart" @touchend.passive="onCalTouchEnd">
        <Transition :name="'cal-slide-' + slideDir">
        <div class="calendar-grid" :key="`${calYear}-${calMonth}`">
        <div v-for="n in calStartBlank" :key="'b'+n" class="cal-cell-empty"></div>
        <div
          v-for="day in calendarDays" :key="day.date"
          class="cal-cell"
          :class="{
            'active': day.hasOrder || day.hasVisit || day.hasDiary || day.weight != null,
            'today': day.date === todayStr,
            'selected': selectedCalDate === day.date,
            'partner': viewPartner,
            'cal-sun': getDayOfWeek(day.date) === 0,
            'cal-sat': getDayOfWeek(day.date) === 6,
            'cal-holiday-day': !!HOLIDAYS[day.date],
            'cal-workday': !!WORKDAYS[day.date],
            'cal-special-day': !!getSpecialDay(day.date),
            'cal-birthday-admin': isBirthdayAdmin(day.date),
            'cal-birthday-user': isBirthdayUser(day.date),
          }"
          @click="selectCalDay(day)"
        >
          <span class="cal-num" :class="{ 'today-num': day.date === todayStr && !viewPartner, 'today-num-partner': day.date === todayStr && viewPartner }">{{ +day.date.split('-')[2] }}</span>
          <div class="cal-emojis">
            <span v-if="day.hasOrder">{{ cfg.calEmojiCooking }}</span>
            <span v-if="day.hasVisit">{{ cfg.calEmojiDining }}</span>
            <span v-if="day.hasDiary">{{ cfg.calEmojiDiary }}</span>
          </div>
          <span v-if="HOLIDAYS[day.date]" class="cal-holiday">{{ HOLIDAYS[day.date] }}</span>
          <span v-else-if="WORKDAYS[day.date]" class="cal-workday-label">班😭</span>
          <span v-else-if="getSpecialDay(day.date)" class="cal-special">{{ getSpecialDay(day.date) }}</span>
          <span v-if="isBirthdayAdmin(day.date)" class="cal-bday-label admin">🎂生日</span>
          <span v-else-if="isBirthdayUser(day.date)" class="cal-bday-label user">🎂TA生日</span>
          <span v-if="day.weight" class="cal-kg" :class="{ 'partner-kg': viewPartner }">{{ displayWeight(day.weight) }}</span>
        </div>
        </div>
        </Transition>
      </div>
    </div>


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
        <!-- 头像 + 背景预览 -->
        <div class="edit-appearance">
          <div class="edit-avatar-col" @click="triggerAvatarUpload()">
            <div class="edit-avatar-ring">
              <img v-if="myProfile.avatarUrl" :src="absImgUrl(myProfile.avatarUrl)" class="edit-avatar-img" />
              <div v-else class="edit-avatar-ph">{{ (myProfile.nickname || '?')[0] }}</div>
            </div>
            <div class="edit-appear-label">换头像</div>
          </div>
          <div class="edit-banner-col" @click="triggerBannerUpload()">
            <div class="edit-banner-preview" :style="myProfile.bannerUrl ? { backgroundImage: `url(${absImgUrl(myProfile.bannerUrl)})` } : {}">
              <span v-if="!myProfile.bannerUrl" class="edit-banner-ph">🖼️</span>
            </div>
            <div class="edit-appear-label">换背景</div>
          </div>
        </div>
        <div class="form-field">
          <div class="form-label">昵称</div>
          <input v-model="editForm.nickname" class="form-input" placeholder="输入昵称" />
        </div>
        <div class="form-field">
          <div class="form-label">身高 (cm)</div>
          <input v-model="editForm.height" class="form-input" type="number" placeholder="如 175" />
        </div>
        <div class="form-field">
          <div class="form-label">生日</div>
          <div class="birthday-display" :class="{ placeholder: !editForm.birthday }" @click="openBirthdayPicker">
            {{ editForm.birthday ? formatBirthday(editForm.birthday) : '点击选择生日' }}
          </div>
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

    <!-- 年月选择器 -->
    <van-popup v-model:show="showMonthPicker" round position="center" :style="{ width: '82vw', borderRadius: '24px', overflow: 'hidden' }">
      <div class="mpicker-wrap">
        <div class="mpicker-header">
          <button class="mpicker-arrow" @click="pickerYear--">‹</button>
          <span class="mpicker-year">{{ pickerYear }}年</span>
          <button class="mpicker-arrow" @click="pickerYear++">›</button>
        </div>
        <div class="mpicker-months">
          <button v-for="m in 12" :key="m" class="mpicker-month"
            :class="{ active: m === pickerMonth && pickerYear === calYear }"
            @click="selectPickerMonth(m)">{{ m }}月</button>
        </div>
        <div class="mpicker-footer">
          <button class="mpicker-today" @click="jumpToCurrentMonth">今月</button>
        </div>
      </div>
    </van-popup>

    <!-- 生日选择器 -->
    <van-popup v-model:show="showBirthdayPicker" round position="bottom">
      <van-date-picker
        v-model="pickerBirthdayVal"
        title="选择生日"
        :min-date="new Date(1940, 0, 1)"
        :max-date="new Date(2010, 11, 31)"
        @confirm="onBirthdayConfirm"
        @cancel="showBirthdayPicker = false"
      />
    </van-popup>

    <!-- 今日速记 action sheet -->
    <van-action-sheet
      v-model:show="showTodaySheet"
      :actions="todaySheetActions"
      title="今日速记"
      cancel-text="取消"
      @select="onTodaySheetSelect"
    />

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
          <div class="ruler-outer">
            <div class="ruler-display">
              <span class="ruler-val">{{ weightDisplayVal.toFixed(1) }}</span>
              <span class="ruler-unit-lbl">{{ weightUnit === 'kg' ? 'kg' : '斤' }}</span>
            </div>
            <div class="ruler-scroll" ref="rulerScrollRef" @scroll.passive="onRulerScroll">
              <canvas ref="rulerCanvasRef" height="44" style="display:block;"></canvas>
            </div>
            <div class="ruler-center-pin"></div>
          </div>
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
        <template v-if="dayDetail">
          <div class="detail-header">
            <div class="detail-date">{{ formatDayLabel(dayDetail.date) }}</div>
            <button class="detail-close" @click="showDayDetail = false">✕</button>
          </div>

          <!-- 体重：双方并排显示 -->
          <div v-if="dayDetail.weight != null || dayDetail.partnerWeight != null" class="detail-weight-row">
            <div v-if="dayDetail.weight != null" class="detail-weight-pill">
              ⚖️ <strong>{{ displayWeight(dayDetail.weight) }} {{ weightUnit === 'kg' ? 'kg' : '斤' }}</strong>
              <span class="weight-author">{{ dayDetail.myNickname }}</span>
              <span v-if="dayDetail.weightNote" class="detail-weight-note">· {{ dayDetail.weightNote }}</span>
            </div>
            <div v-if="dayDetail.partnerWeight != null" class="detail-weight-pill partner">
              ⚖️ <strong>{{ displayWeight(dayDetail.partnerWeight) }} {{ weightUnit === 'kg' ? 'kg' : '斤' }}</strong>
              <span class="weight-author">{{ dayDetail.partnerNickname }}</span>
            </div>
          </div>

          <!-- 做饭/订单：整个租户共享 -->
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
                <div class="rev-stars">{{ '★'.repeat(Math.min(5, Math.max(0, Math.round(order.review.score)))) }}<span class="rev-empty-stars">{{ '★'.repeat(Math.max(0, 5 - Math.min(5, Math.round(order.review.score)))) }}</span></div>
                <div v-if="order.review.content" class="rev-text">"{{ order.review.content }}"</div>
                <div v-if="order.review.images?.length" class="rev-imgs">
                  <img v-for="(img, i) in order.review.images" :key="i" :src="absImgUrl(img)" class="rev-thumb" @click="previewImg(order.review.images.map(absImgUrl), i)" />
                </div>
              </div>
            </div>
          </template>

          <!-- 美食打卡：自己和伴侣的合并，isOwn=true 才能删 -->
          <template v-if="dayDetail.allVisits?.length">
            <div class="detail-section-label">{{ cfg.calEmojiDining }} {{ cfg.calLabelDining }}</div>
            <div v-for="v in dayDetail.allVisits" :key="v.id" class="visit-block" :class="{ 'partner-block': !v.isOwn }">
              <div class="vb-head">
                <span class="vb-meal">{{ getMealTypeName(v.mealType) }}</span>
                <span class="vb-name">{{ v.restaurantName }}</span>
                <span v-if="v.score" class="vb-score">{{ '★'.repeat(Math.min(5, Math.max(0, Math.round(v.score)))) }}</span>
                <span v-if="!v.isOwn" class="vb-author">{{ v.authorNickname }}</span>
                <button v-if="v.isOwn && !viewPartner" class="vb-del" @click="confirmDeleteVisit(v, dayDetail.date)">✕</button>
              </div>
              <div v-if="v.content" class="vb-text">"{{ v.content }}"</div>
              <div v-if="v.imageUrls?.length" class="rev-imgs">
                <img v-for="(img, i) in v.imageUrls" :key="i" :src="absImgUrl(img)" class="rev-thumb" @click="previewImg(v.imageUrls.map(absImgUrl), i)" />
              </div>
            </div>
            <button v-if="!viewPartner" class="more-btn" @click="openVisitForm(dayDetail.date)">+ 再添一条</button>
          </template>

          <!-- 日记：自己和伴侣的合并，isOwn=true 才能编辑删除 -->
          <template v-if="dayDetail.allDiaries?.length">
            <div class="detail-section-label">{{ cfg.calEmojiDiary }} {{ cfg.calLabelDiary }}</div>
            <div v-for="d in dayDetail.allDiaries" :key="d.id" class="diary-block" :class="{ 'partner-block': !d.isOwn }">
              <div v-if="!d.isOwn" class="diary-author">{{ d.authorNickname }}</div>
              <p class="diary-text">{{ d.content }}</p>
              <div v-if="d.imageUrls?.length" class="rev-imgs" style="margin-top:8px">
                <img v-for="(img, i) in d.imageUrls" :key="i" :src="absImgUrl(img)" class="rev-thumb" @click="previewImg(d.imageUrls.map(absImgUrl), i)" />
              </div>
              <div v-if="d.isOwn && !viewPartner" class="diary-actions">
                <button class="da-btn" @click="editDiary(d, dayDetail.date)">✏️ 编辑</button>
                <button class="da-btn del" @click="confirmDeleteDiary(d, dayDetail.date)">🗑 删除</button>
              </div>
            </div>
          </template>

          <div v-if="!dayDetail.orders?.length && !dayDetail.allVisits?.length && !dayDetail.allDiaries?.length && dayDetail.weight == null && dayDetail.partnerWeight == null" class="detail-empty">这天还没有记录</div>

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

    <ImageCropper
      :visible="showAvatarCropper"
      :img-src="avatarCropSrc"
      @confirm="confirmAvatarCrop"
      @cancel="cancelAvatarCrop"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { showImagePreview, showToast, showConfirmDialog } from 'vant'
import { useLayoutConfigStore } from '../../../stores/layoutConfig.js'
import {
  getMyProfile, updateMyProfile, uploadAvatar, uploadBanner,
  getWeightRecords, saveWeight, deleteWeight,
  getCalendar, getDayDetail,
  getPartnerProfile, getPartnerWeight, getPartnerCalendar, getPartnerDayDetail
} from '../../../api/orderProfile.js'
import { saveVisit, deleteVisit, saveDiary, deleteDiary, uploadLifePhoto } from '../../../api/orderLifeRecord.js'
import { absImgUrl } from '../../../api/orderFile.js'
import { prepareLifePhoto } from '../../../utils/imageUtils.js'
import ImageCropper from '../../../components/order/ImageCropper.vue'

const layoutStore = useLayoutConfigStore()
const cfg = computed(() => layoutStore.config)

// 法定节假日 2025-2028（含七夕、中秋）
const HOLIDAYS = {
  '2025-01-01':'元旦',
  '2025-01-28':'春节','2025-01-29':'春节','2025-01-30':'春节','2025-01-31':'春节',
  '2025-02-01':'春节','2025-02-02':'春节','2025-02-03':'春节','2025-02-04':'春节',
  '2025-04-04':'清明','2025-04-05':'清明','2025-04-06':'清明',
  '2025-05-01':'劳动','2025-05-02':'劳动','2025-05-03':'劳动','2025-05-04':'劳动','2025-05-05':'劳动',
  '2025-05-31':'端午','2025-06-01':'端午','2025-06-02':'端午',
  '2025-08-29':'七夕',
  '2025-10-01':'国庆','2025-10-02':'国庆','2025-10-03':'国庆','2025-10-04':'国庆',
  '2025-10-05':'国庆','2025-10-06':'中秋','2025-10-07':'国庆',
  '2026-01-01':'元旦',
  '2026-02-17':'春节','2026-02-18':'春节','2026-02-19':'春节','2026-02-20':'春节',
  '2026-02-21':'春节','2026-02-22':'春节','2026-02-23':'春节','2026-02-24':'春节',
  '2026-04-04':'清明','2026-04-05':'清明','2026-04-06':'清明',
  '2026-05-01':'劳动','2026-05-02':'劳动','2026-05-03':'劳动','2026-05-04':'劳动','2026-05-05':'劳动',
  '2026-06-19':'端午','2026-06-20':'端午','2026-06-21':'端午',
  '2026-08-19':'七夕',
  '2026-09-23':'中秋','2026-09-24':'中秋','2026-09-25':'中秋',
  '2026-10-01':'国庆','2026-10-02':'国庆','2026-10-03':'国庆','2026-10-04':'国庆',
  '2026-10-05':'国庆','2026-10-06':'国庆','2026-10-07':'国庆',
  '2027-01-01':'元旦',
  '2027-02-06':'春节','2027-02-07':'春节','2027-02-08':'春节','2027-02-09':'春节',
  '2027-02-10':'春节','2027-02-11':'春节','2027-02-12':'春节',
  '2027-04-04':'清明','2027-04-05':'清明','2027-04-06':'清明',
  '2027-05-01':'劳动','2027-05-02':'劳动','2027-05-03':'劳动','2027-05-04':'劳动','2027-05-05':'劳动',
  '2027-05-20':'端午','2027-05-21':'端午','2027-05-22':'端午',
  '2027-08-09':'七夕',
  '2027-10-01':'国庆','2027-10-02':'国庆','2027-10-03':'国庆','2027-10-04':'国庆',
  '2027-10-05':'国庆','2027-10-06':'国庆','2027-10-07':'国庆',
  '2027-10-16':'中秋','2027-10-17':'中秋','2027-10-18':'中秋',
  '2028-01-01':'元旦','2028-01-02':'元旦','2028-01-03':'元旦',
  '2028-01-26':'春节','2028-01-27':'春节','2028-01-28':'春节','2028-01-29':'春节',
  '2028-01-30':'春节','2028-01-31':'春节','2028-02-01':'春节',
  '2028-04-04':'清明','2028-04-05':'清明',
  '2028-05-01':'劳动','2028-05-02':'劳动','2028-05-03':'劳动','2028-05-04':'劳动','2028-05-05':'劳动',
  '2028-06-08':'端午','2028-06-09':'端午','2028-06-10':'端午',
  '2028-08-27':'七夕',
  '2028-09-03':'中秋','2028-09-04':'中秋','2028-09-05':'中秋',
  '2028-10-01':'国庆','2028-10-02':'国庆','2028-10-03':'国庆','2028-10-04':'国庆',
  '2028-10-05':'国庆','2028-10-06':'国庆','2028-10-07':'国庆',
}
const WORKDAYS = {
  '2025-01-26':'调休','2025-02-08':'调休',
  '2025-04-27':'调休',
  '2025-09-28':'调休','2025-10-11':'调休',
  '2026-02-15':'调休','2026-02-28':'调休',
  '2026-04-26':'调休',
  '2026-09-27':'调休','2026-10-10':'调休',
  '2027-01-31':'调休','2027-02-20':'调休',
  '2027-04-25':'调休',
  '2027-10-09':'调休','2027-10-23':'调休',
  '2028-01-23':'调休',
  '2028-04-23':'调休',
  '2028-09-30':'调休','2028-10-14':'调休',
}
const SPECIAL_DAYS = { '02-14': '情人节 ♥', '05-20': '520 ♥', '12-25': '圣诞 ✦' }

function getDayOfWeek(dateStr) { return new Date(dateStr + 'T00:00:00').getDay() }
function getSpecialDay(date) { return SPECIAL_DAYS[date.slice(5)] || null }
function getBirthdayMD(bday) {
  if (!bday) return null
  const p = bday.split('-')
  return p.length === 3 ? `${p[1]}-${p[2]}` : (p.length === 2 ? bday : null)
}
function formatBirthday(bday) {
  if (!bday) return ''
  const p = bday.split('-')
  if (p.length === 3) return `${parseInt(p[1])}月${parseInt(p[2])}日`
  if (p.length === 2) return `${parseInt(p[0])}月${parseInt(p[1])}日`
  return bday
}

const viewPartner = ref(false)
const myProfile = ref({ nickname: '', avatarUrl: '', bannerUrl: null, height: null, bio: '', birthday: null, currentWeight: null, currentWeightDate: null })
const partnerProfile = ref({ birthday: null, bannerUrl: null })
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
const showTodaySheet = ref(false)
const showDayDetail = ref(false)
const showMonthPicker = ref(false)
const pickerYear = ref(new Date().getFullYear())
const pickerMonth = ref(new Date().getMonth() + 1)
const dayDetailLoading = ref(false)
const saving = ref(false)
const savingWeight = ref(false)
const savingVisit = ref(false)
const savingDiary = ref(false)
const avatarInputRef = ref(null)
const bannerInputRef = ref(null)
const showAvatarCropper = ref(false)
const avatarCropSrc = ref('')
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

// Weight ruler
const weightDisplayVal = ref(60)
const isWeightDragging = ref(false)
watch(weightUnit, () => {
  const kg = parseFloat(weightForm.value.weight) || 0
  weightDisplayVal.value = weightUnit.value === 'jin' ? parseFloat((kg * 2).toFixed(1)) : parseFloat(kg.toFixed(1))
  if (showWeightModal.value) nextTick(() => snapRulerToKg(kg, false))
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

// ── Weight ruler ──────────────────────────────────────────────────────────
const rulerScrollRef = ref(null)
const rulerCanvasRef = ref(null)
let _rulerBusy = false
const RULER_MIN = 30, RULER_MAX = 150, RULER_STEP = 0.5, RULER_PX = 8

function drawRulerCanvas() {
  const canvas = rulerCanvasRef.value
  const scroll = rulerScrollRef.value
  if (!canvas || !scroll) return
  const halfW = scroll.offsetWidth / 2
  const steps = (RULER_MAX - RULER_MIN) / RULER_STEP
  const totalW = Math.round(steps * RULER_PX + scroll.offsetWidth)
  canvas.width = totalW
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, totalW, 44)
  for (let i = 0; i <= steps; i++) {
    const kg = RULER_MIN + i * RULER_STEP
    const x = halfW + i * RULER_PX
    let h, sw, color
    if (Math.round(kg) % 10 === 0) { h = 34; sw = 2; color = '#6d6d72' }
    else if (Math.round(kg * 2) % 10 === 0) { h = 26; sw = 1.5; color = '#aeaeb2' }
    else if (Math.round(kg) === kg) { h = 18; sw = 1.5; color = '#c8c8cc' }
    else { h = 10; sw = 1; color = '#e5e5ea' }
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = sw
    ctx.moveTo(x, 44 - h)
    ctx.lineTo(x, 44)
    ctx.stroke()
    if (Math.round(kg) % 10 === 0) {
      ctx.font = '9px -apple-system, system-ui'
      ctx.fillStyle = '#aeaeb2'
      ctx.textAlign = 'center'
      ctx.fillText(kg.toFixed(0), x, 44 - h - 4)
    }
  }
}

function snapRulerToKg(kg, smooth) {
  const el = rulerScrollRef.value
  if (!el) return
  const left = Math.round((kg - RULER_MIN) / RULER_STEP) * RULER_PX
  el.scrollTo({ left: Math.max(0, left), behavior: smooth ? 'smooth' : 'instant' })
}

function onRulerScroll() {
  if (_rulerBusy) return
  const el = rulerScrollRef.value
  if (!el) return
  const rawKg = RULER_MIN + (el.scrollLeft / RULER_PX) * RULER_STEP
  const kg = Math.max(RULER_MIN, Math.min(RULER_MAX, Math.round(rawKg / RULER_STEP) * RULER_STEP))
  _rulerBusy = true
  const display = weightUnit.value === 'jin' ? kg * 2 : kg
  weightDisplayVal.value = parseFloat(display.toFixed(1))
  weightForm.value.weight = parseFloat(kg.toFixed(1)).toString()
  setTimeout(() => { _rulerBusy = false }, 30)
}

watch(() => showWeightModal.value, (show) => {
  if (!show) return
  nextTick(() => {
    drawRulerCanvas()
    const kg = parseFloat(weightForm.value.weight) || 60
    snapRulerToKg(Math.max(RULER_MIN, Math.min(RULER_MAX, kg)), false)
  })
})
// ─────────────────────────────────────────────────────────────────────────

const editForm = ref({ nickname: '', height: '', bio: '', birthday: '' })
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
onUnmounted(() => {
  if (avatarCropSrc.value) URL.revokeObjectURL(avatarCropSrc.value)
})

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

const slideDir = ref('left')
let touchStartX = 0
function onCalTouchStart(e) { touchStartX = e.touches[0].clientX }
function onCalTouchEnd(e) {
  const delta = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(delta) > 50) { delta < 0 ? changeMonth(1) : changeMonth(-1) }
}
function changeMonth(delta) {
  slideDir.value = delta > 0 ? 'left' : 'right'
  let m = calMonth.value + delta, y = calYear.value
  if (m < 1) { m = 12; y-- }
  if (m > 12) { m = 1; y++ }
  calMonth.value = m; calYear.value = y; loadCalendar()
}

function openMonthPicker() { pickerYear.value = calYear.value; pickerMonth.value = calMonth.value; showMonthPicker.value = true }
function selectPickerMonth(m) {
  const newTotal = pickerYear.value * 12 + m, curTotal = calYear.value * 12 + calMonth.value
  slideDir.value = newTotal >= curTotal ? 'left' : 'right'
  calYear.value = pickerYear.value; calMonth.value = m; pickerMonth.value = m; loadCalendar(); showMonthPicker.value = false
}
function jumpToCurrentMonth() {
  const now = new Date()
  const newTotal = now.getFullYear() * 12 + now.getMonth() + 1, curTotal = calYear.value * 12 + calMonth.value
  slideDir.value = newTotal >= curTotal ? 'left' : 'right'
  pickerYear.value = now.getFullYear(); calYear.value = now.getFullYear(); calMonth.value = now.getMonth() + 1; pickerMonth.value = now.getMonth() + 1; loadCalendar(); showMonthPicker.value = false
}

// 生日选择器
const showBirthdayPicker = ref(false)
const pickerBirthdayVal = ref(['1995', '01', '01'])
function openBirthdayPicker() {
  if (editForm.value.birthday) {
    const parts = editForm.value.birthday.split('-')
    pickerBirthdayVal.value = [parts[0], parts[1], parts[2]]
  } else {
    pickerBirthdayVal.value = ['1995', '01', '01']
  }
  showBirthdayPicker.value = true
}
function onBirthdayConfirm({ selectedValues }) { editForm.value.birthday = selectedValues.join('-'); showBirthdayPicker.value = false }

// 生日日历高亮：管理员=蓝色，普通用户=红色
function isBirthdayAdmin(date) { return getBirthdayMD(myProfile.value.birthday) === date.slice(5) }
function isBirthdayUser(date) { return getBirthdayMD(partnerProfile.value.birthday) === date.slice(5) }

async function selectCalDay(day) {
  selectedCalDate.value = day.date
  const hasData = day.hasOrder || day.hasVisit || day.hasDiary || day.weight != null
  if (!hasData) {
    if (!viewPartner.value) {
      dayDetail.value = { date: day.date, orders: [], allVisits: [], allDiaries: [], weight: null, weightNote: null }
      showDayDetail.value = true
    }
    return
  }
  dayDetail.value = null
  const toast = showToast({ type: 'loading', message: '加载中…', forbidClick: false, duration: 0 })
  try {
    dayDetail.value = viewPartner.value ? await getPartnerDayDetail(day.date) : await getDayDetail(day.date)
    if (dayDetail.value) showDayDetail.value = true
  } catch (e) {
    showToast(e.message || '加载失败')
  } finally {
    toast.close()
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
  if (avatarCropSrc.value) URL.revokeObjectURL(avatarCropSrc.value)
  avatarCropSrc.value = URL.createObjectURL(file)
  showAvatarCropper.value = true
  e.target.value = ''
}
async function confirmAvatarCrop(blob) {
  if (!blob) return
  const fd = new FormData(); fd.append('file', blob, 'avatar.jpg')
  try {
    await uploadAvatar(fd)
    await loadSelf()
    showToast('头像已更新 ✓')
  } catch (err) { showToast(err.message) }
  finally { cancelAvatarCrop() }
}
function cancelAvatarCrop() {
  showAvatarCropper.value = false
  if (avatarCropSrc.value) URL.revokeObjectURL(avatarCropSrc.value)
  avatarCropSrc.value = ''
}
function triggerBannerUpload() { bannerInputRef.value?.click() }
async function onBannerChange(e) {
  const file = e.target.files?.[0]; if (!file) return
  const resized = await resizeBanner(file)
  const fd = new FormData(); fd.append('file', resized, 'banner.jpg')
  try {
    await uploadBanner(fd)
    await loadSelf()
    showToast('背景已更新 ✓')
  } catch (err) { showToast(err.message) }
  e.target.value = ''
}
function resizeBanner(file) {
  return new Promise(resolve => {
    const img = new Image(), url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const maxW = 1200, ratio = Math.min(1, maxW / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(resolve, 'image/jpeg', 0.88)
    }; img.src = url
  })
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

const todaySheetActions = computed(() => [
  { name: `${cfg.value.calEmojiDining} ${cfg.value.calLabelDining}`, subname: '记录今天的外出打卡' },
  { name: `${cfg.value.calEmojiDiary} ${cfg.value.calLabelDiary}`, subname: '记录今天的心情日记' },
  { name: '⚖️ 体重', subname: '记录今天的体重数据' },
])
function onTodaySheetSelect(action, index) {
  showTodaySheet.value = false
  if (index === 0) openVisitForm(todayStr)
  else if (index === 1) openDiaryForm(todayStr)
  else openWeightInput()
}

function openEdit() {
  editForm.value = { nickname: myProfile.value.nickname || '', height: myProfile.value.height || '', bio: myProfile.value.bio || '', birthday: myProfile.value.birthday || '' }
  showEditModal.value = true
}
async function saveProfile() {
  saving.value = true
  try {
    await updateMyProfile({ nickname: editForm.value.nickname || null, height: editForm.value.height ? parseFloat(editForm.value.height) : null, bio: editForm.value.bio || null, birthday: editForm.value.birthday || null })
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
function editDiary(d, date) {
  diaryForm.value = { diaryDate: date, content: d.content || '' }
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
.profile-page { min-height: 100vh; background: #ededf2; padding-bottom: 100px; }

/* ─── Hero banner ───────────────────────────── */
.hero-banner {
  position: relative; height: 248px;
  background: #d7a1ac;
  transition: background 0.4s;
}
.hero-banner.partner {
  background: linear-gradient(135deg, #93c5fd 0%, #5b8af0 55%, #3b65cc 100%);
}
.hero-banner.partner .banner-bg {
  background:
    radial-gradient(ellipse at 30% 60%, rgba(255,255,255,0.16) 0%, transparent 60%),
    linear-gradient(135deg, #93c5fd 0%, #5b8af0 55%, #3b65cc 100%);
}
.banner-inner-clip {
  position: absolute; inset: 0; overflow: hidden;
}
.banner-inner-clip::after {
  content: '';
  position: absolute; inset: 0;
  background:
    linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.04) 42%, rgba(0,0,0,0.52) 100%),
    linear-gradient(to right, rgba(0,0,0,0.22), transparent 48%);
  pointer-events: none;
}
.banner-bg {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 30% 60%, rgba(255,255,255,0.16) 0%, transparent 60%),
    linear-gradient(135deg, #e5a0ad 0%, #c96b7e 56%, #8f4c61 100%);
}
.banner-img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; object-position: center;
}
/* 编辑资料 - 头像和背景 */
.edit-appearance { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 20px; }
.edit-avatar-col { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
.edit-avatar-ring { width: 68px; height: 68px; border-radius: 50%; overflow: hidden; border: 2.5px solid #c0d0f8; background: #eef2fe; flex-shrink: 0; }
.edit-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.edit-avatar-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 700; color: #5b8af0; }
.edit-banner-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
.edit-banner-preview { width: 100%; height: 68px; border-radius: 12px; background: #f2f2f7; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; border: 1.5px dashed #c0cce8; }
.edit-banner-ph { font-size: 24px; opacity: 0.5; }
.edit-appear-label { font-size: 11px; color: #8e8e93; }
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
.hero-profile-row {
  position: absolute; left: 16px; right: 16px; bottom: -38px; z-index: 3;
  display: flex; align-items: flex-start; gap: 12px;
  pointer-events: none;
}
.hero-profile-row .avatar-ring { pointer-events: auto; }
.hero-profile-copy {
  flex: 1; min-width: 0; padding-top: 9px;
}

/* ─── Profile card ──────────────────────────── */
.profile-card {
  position: relative; z-index: 1;
  background: #fff; margin: 0 0 12px; border-radius: 0 0 14px 14px;
  padding: 40px 16px 16px; box-shadow: 0 6px 18px rgba(0,0,0,0.04);
}
.avatar-ring {
  flex-shrink: 0; position: relative;
  width: 76px; height: 76px; border-radius: 12px;
  box-shadow: 0 8px 18px rgba(0,0,0,0.18);
  overflow: hidden; background: transparent;
}
.avatar-ring.clickable { cursor: pointer; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, #7aa3f5, #3b65cc);
  color: #fff; font-size: 28px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.avatar-edit-badge {
  position: absolute; inset: 0; border-radius: 12px;
  background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; opacity: 0; transition: opacity 0.2s;
}
.avatar-ring.clickable:active .avatar-edit-badge { opacity: 1; }
.profile-name {
  color: #fff; font-size: 22px; font-weight: 800; line-height: 1.15;
  text-shadow: 0 1px 10px rgba(0,0,0,0.38);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ta-badge { font-size: 11px; background: rgba(255,255,255,0.88); color: #5b8af0; border-radius: 8px; padding: 2px 8px; font-weight: 700; text-shadow: none; }
.edit-btn {
  flex-shrink: 0;
  background: #fff; border: 1px solid #d8d8de;
  color: #2c2c2e; border-radius: 16px; padding: 6px 12px;
  font-size: 12px; font-weight: 700; cursor: pointer;
}
.edit-btn:active { background: #f3f3f6; }
.profile-info-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 2px 0 14px;
  min-width: 0;
}
.profile-signature {
  flex: 1;
  min-width: 0;
  color: #6d6d72;
  font-size: 14px;
  line-height: 1.55;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.profile-signature.muted { color: #aeaeb2; }
.profile-meta-row {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin-bottom: 12px;
}
.profile-bio { font-size: 13px; color: #6d6d72; line-height: 1.5; }
.profile-birthday {
  flex-shrink: 0;
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 12px; color: #6d6d72;
  padding: 0;
}
.stats-row {
  display: flex; align-items: center;
  border-top: 1px solid #f0f0f3;
  padding-top: 13px;
}
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
  background: #fff; margin: 0 12px 12px; border-radius: 14px;
  padding: 14px 14px 12px; box-shadow: 0 1px 6px rgba(0,0,0,0.035);
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
/* 日历滑动容器 */
.cal-weekday-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
.cal-slide-wrap { position: relative; overflow: hidden; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
/* 月份切换滑动动画 */
.cal-slide-left-enter-active, .cal-slide-right-enter-active { transition: transform 0.26s ease, opacity 0.26s ease; }
.cal-slide-left-leave-active, .cal-slide-right-leave-active { position: absolute; top: 0; left: 0; right: 0; transition: transform 0.26s ease, opacity 0.26s ease; }
.cal-slide-left-enter-from { transform: translateX(35%); opacity: 0; }
.cal-slide-left-leave-to { transform: translateX(-35%); opacity: 0; }
.cal-slide-right-enter-from { transform: translateX(-35%); opacity: 0; }
.cal-slide-right-leave-to { transform: translateX(35%); opacity: 0; }
.cal-weekday { text-align: center; font-size: 11px; color: #aeaeb2; font-weight: 600; padding: 4px 0 6px; }
.cal-weekday.wd-sun { color: #f87171; }
.cal-weekday.wd-sat { color: #5b8af0; }
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
/* 双休底色 */
.cal-cell.cal-sun { background: rgba(248,113,113,0.05); }
.cal-cell.cal-sat { background: rgba(91,138,240,0.05); }
.cal-cell.cal-sun.active { background: rgba(201,107,126,0.09); }
.cal-cell.cal-sat.active { background: rgba(91,138,240,0.09); }
/* 法定节假日 */
.cal-holiday { display: block; font-size: 7.5px; color: #f87171; font-weight: 800; line-height: 1.2; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: clip; }
.cal-cell.cal-holiday-day { border-top: 2px solid rgba(248,113,113,0.4); }
/* 调休补班 */
.cal-cell.cal-workday { border-top: 2px solid rgba(251,146,60,0.55); }
.cal-workday-label { display: block; font-size: 7px; color: #f97316; font-weight: 800; line-height: 1.2; text-align: center; }
/* 浪漫节日 */
.cal-special { display: block; font-size: 7.5px; color: #ec4899; font-weight: 800; line-height: 1.2; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: clip; }
.cal-cell.cal-special-day { border-top: 2px solid rgba(236,72,153,0.45); }
/* 生日高亮 */
.cal-cell.cal-birthday-admin { border-top: 2.5px solid #5b8af0 !important; background: rgba(91,138,240,0.1) !important; }
.cal-cell.cal-birthday-user { border-top: 2.5px solid #f87171 !important; background: rgba(248,113,113,0.1) !important; }
.cal-bday-label { display: block; font-size: 7.5px; font-weight: 800; line-height: 1.2; text-align: center; white-space: nowrap; overflow: hidden; }
.cal-bday-label.admin { color: #5b8af0; }
.cal-bday-label.user { color: #f87171; }
.cal-num { font-size: 13px; color: #3a3a3c; font-weight: 500; line-height: 1.3; }
.cal-cell.cal-sun .cal-num { color: #f87171; }
.cal-cell.cal-sat .cal-num { color: #5b8af0; }
/* 年月选择器弹窗 */
.mpicker-wrap { overflow: hidden; }
.mpicker-header { background: linear-gradient(135deg, #5b8af0 0%, #7aa3f5 100%); display: flex; align-items: center; justify-content: center; gap: 20px; padding: 22px 16px 20px; }
.mpicker-arrow { font-size: 22px; color: rgba(255,255,255,0.95); background: rgba(255,255,255,0.22); border: none; cursor: pointer; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.mpicker-year { font-size: 22px; font-weight: 800; color: #fff; min-width: 100px; text-align: center; letter-spacing: 1px; }
.mpicker-months { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 16px; }
.mpicker-month { font-size: 15px; font-weight: 500; padding: 12px 0; border-radius: 16px; border: none; background: #f2f2f7; color: #3a3a3c; cursor: pointer; transition: all 0.15s; }
.mpicker-month.active { background: #5b8af0; color: #fff; font-weight: 700; box-shadow: 0 4px 12px rgba(91,138,240,0.35); transform: scale(1.04); }
.mpicker-footer { padding: 4px 16px 16px; text-align: center; }
.mpicker-today { font-size: 14px; color: #5b8af0; background: rgba(91,138,240,0.1); border: none; border-radius: 20px; padding: 8px 28px; cursor: pointer; font-weight: 600; }
/* 生日选择展示框 */
.birthday-display { padding: 11px 14px; border: 1.5px solid #e5e5ea; border-radius: 12px; font-size: 15px; background: #fff; cursor: pointer; color: #1c1c1e; min-height: 44px; display: flex; align-items: center; }
.birthday-display.placeholder { color: #c7c7cc; }
/* 月份标签可点击 */
.month-label.clickable { cursor: pointer; }
.month-label.clickable:hover { opacity: 0.75; }
/* 日期数字颜色 */
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
.cal-header-right { display: flex; align-items: center; gap: 8px; }
.cal-add-today-btn {
  background: linear-gradient(135deg, #5b8af0, #7aa3f5);
  color: #fff; border: none; border-radius: 16px;
  padding: 5px 11px; font-size: 12px; font-weight: 700;
  cursor: pointer; white-space: nowrap;
  box-shadow: 0 2px 8px rgba(91,138,240,0.28);
  transition: opacity 0.15s, transform 0.12s;
}
.cal-add-today-btn:active { opacity: 0.82; transform: scale(0.93); }
.month-nav { display: flex; align-items: center; gap: 4px; }
.month-btn { background: none; border: none; font-size: 22px; color: #c96b7e; cursor: pointer; padding: 0 4px; line-height: 1; }
.month-label { font-size: 13px; font-weight: 600; color: #1c1c1e; min-width: 72px; text-align: center; }


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
/* ─── Weight ruler ───────────────────────────── */
.ruler-outer {
  position: relative; background: #f8f8fa; border-radius: 16px;
  overflow: hidden; height: 80px; margin-bottom: 4px;
}
.ruler-display {
  position: absolute; top: 0; left: 0; right: 0; height: 36px;
  display: flex; align-items: center; justify-content: center; gap: 4px;
  z-index: 2; pointer-events: none;
}
.ruler-val { font-size: 26px; font-weight: 800; color: #c96b7e; }
.ruler-unit-lbl { font-size: 13px; font-weight: 600; color: #c96b7e; align-self: flex-end; margin-bottom: 4px; }
.ruler-scroll {
  position: absolute; bottom: 0; left: 0; right: 0; height: 44px;
  overflow-x: scroll; overflow-y: hidden; scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.ruler-scroll::-webkit-scrollbar { display: none; }
.ruler-center-pin {
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 2px; height: 44px; background: #c96b7e; border-radius: 1px;
  z-index: 3; pointer-events: none; opacity: 0.8;
}
.ruler-outer::before, .ruler-outer::after {
  content: ''; position: absolute; bottom: 0; height: 44px; width: 52px;
  z-index: 2; pointer-events: none;
}
.ruler-outer::before { left: 0; background: linear-gradient(to right, #f8f8fa, transparent); }
.ruler-outer::after { right: 0; background: linear-gradient(to left, #f8f8fa, transparent); }

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
.detail-weight-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.detail-weight-pill {
  display: inline-flex; align-items: center; gap: 4px;
  background: linear-gradient(135deg, #fff0f3, #ffe4ea);
  color: #c96b7e; border-radius: 20px; padding: 6px 14px;
  font-size: 13px;
}
.detail-weight-pill.partner { background: linear-gradient(135deg, #eff6ff, #dbeafe); color: #5b8af0; }
.weight-author { font-size: 11px; opacity: 0.75; margin-left: 2px; }
.detail-weight-note { color: #d49ea8; font-size: 12px; }
.diary-author { font-size: 11px; font-weight: 700; color: #5b8af0; margin-bottom: 4px; }
.vb-author { font-size: 11px; font-weight: 700; color: #5b8af0; margin-left: auto; }
.detail-section-label { font-size: 12px; font-weight: 800; color: #aeaeb2; text-transform: uppercase; letter-spacing: 0.5px; margin: 14px 0 8px; }
.detail-empty { text-align: center; color: #c8c8cc; font-size: 14px; padding: 24px 0; }
.detail-partner-divider {
  display: flex; align-items: center; gap: 8px; margin: 18px 0 4px;
  font-size: 11px; font-weight: 700; color: #5b8af0; text-transform: uppercase; letter-spacing: 0.5px;
}
.detail-partner-divider::before, .detail-partner-divider::after {
  content: ''; flex: 1; height: 1px; background: #e0eaff;
}
.partner-block { border-left: 3px solid #bfdbfe; padding-left: 8px; }
.profile-card.partner { border-top: none; }
.profile-card.partner .avatar-ring { box-shadow: 0 8px 18px rgba(0,0,0,0.18); }

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
