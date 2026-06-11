import { Solar } from 'lunar-javascript'

const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_SHI = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养']

const YANG_CS = { '甲': 10, '丙': 2, '戊': 2, '庚': 5, '壬': 8 }
const YIN_CS  = { '乙': 6,  '丁': 9, '己': 9,  '辛': 0, '癸': 3 }

export function getDiShi(gan, zhi) {
  const zi = ZHI.indexOf(zhi)
  if (YANG_CS[gan] !== undefined) {
    return DI_SHI[(zi - YANG_CS[gan] + 12) % 12]
  } else {
    return DI_SHI[(YIN_CS[gan] - zi + 12) % 12]
  }
}

const GAN_WX = { 甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水' }
const IS_YANG = { 甲:true,乙:false,丙:true,丁:false,戊:true,己:false,庚:true,辛:false,壬:true,癸:false }
const WX_SHENG = { 木:'火',火:'土',土:'金',金:'水',水:'木' }
const WX_KE    = { 木:'土',火:'金',土:'水',金:'木',水:'火' }

export function getShiShen(dayGan, targetGan) {
  if (!targetGan || !dayGan) return ''
  if (targetGan === dayGan) return '日主'
  const dw = GAN_WX[dayGan], tw = GAN_WX[targetGan]
  const same = IS_YANG[dayGan] === IS_YANG[targetGan]
  if (tw === dw) return same ? '比肩' : '劫财'
  if (WX_SHENG[dw] === tw) return same ? '食神' : '伤官'
  if (WX_KE[dw] === tw) return same ? '偏财' : '正财'
  if (WX_KE[tw] === dw) return same ? '七杀' : '正官'
  if (WX_SHENG[tw] === dw) return same ? '偏印' : '正印'
  return ''
}

const SS_SHORT = {
  '比肩':'比','劫财':'劫','食神':'食','伤官':'伤','偏财':'才','正财':'财',
  '七杀':'杀','正官':'官','偏印':'枭','正印':'印','日主':'日'
}
export function ssShort(s) { return SS_SHORT[s] || s }

// 神煞 lookup tables. Different排盘系统在神煞口径上会有细微差异；
// 这里采用常见四柱软件的做法：日干/年干、日支/年支、月令三套规则并用。
const TIANYI = { 甲:[1,7],戊:[1,7],庚:[1,7],乙:[0,8],己:[0,8],丙:[11,9],丁:[11,9],壬:[3,5],癸:[3,5],辛:[6,2] }
const WENCHANG = { 甲:5,乙:6,丙:8,丁:9,戊:8,己:9,庚:11,辛:0,壬:2,癸:3 }
const TIANZHU = { 甲:5,乙:6,丙:5,丁:6,戊:8,己:9,庚:11,辛:0,壬:2,癸:3 }
const LU = { 甲:2,乙:3,丙:5,丁:6,戊:5,己:6,庚:8,辛:9,壬:11,癸:0 }
const YANGREN = { 甲:3,乙:2,丙:6,丁:5,戊:6,己:5,庚:9,辛:8,壬:0,癸:11 }
const FEIREN = Object.fromEntries(Object.entries(YANGREN).map(([gan, idx]) => [gan, (idx + 6) % 12]))
const TAIJI = { 甲:[0,6],乙:[0,6],丙:[3,9],丁:[3,9],戊:[1,4,7,10],己:[1,4,7,10],庚:[2,11],辛:[2,11],壬:[5,8],癸:[5,8] }
const FUXING = { 甲:[2,0],乙:[1,11],丙:[2,0],丁:[11,9],戊:[8],己:[7],庚:[6],辛:[5],壬:[4],癸:[3] }
const GUOYIN = { 甲:10,乙:11,丙:1,丁:2,戊:1,己:2,庚:4,辛:5,壬:7,癸:8 }
const JINYU = { 甲:4,乙:5,丙:7,丁:8,戊:7,己:8,庚:10,辛:11,壬:1,癸:2 }
const LIUXIA = { 甲:9,乙:10,丙:7,丁:8,戊:5,己:6,庚:4,辛:3,壬:11,癸:2 }
const XUEREN = { 甲:3,乙:4,丙:6,丁:7,戊:6,己:7,庚:9,辛:10,壬:0,癸:1 }
const XUETANG = { 甲:11,乙:6,丙:2,丁:9,戊:2,己:9,庚:5,辛:0,壬:8,癸:3 }
const CIGUAN = { 甲:2,乙:3,丙:2,丁:5,戊:5,己:6,庚:8,辛:9,壬:11,癸:0 }
// 桃花/驿马/将星/华盖 based on year or day Zhi trio
function getSanHe(zhi) {
  const TRIO = { 申:0,子:0,辰:0, 寅:1,午:1,戌:1, 巳:2,酉:2,丑:2, 亥:3,卯:3,未:3 }
  return TRIO[zhi]
}
const TAOHUA_IDX  = [9,6,3,0]
const YIMA_IDX    = [2,8,11,5]
const JIANXING_IDX= [0,6,9,3]
const HUAGAI_IDX  = [4,10,1,7]
const JIESHA_IDX  = [5,11,2,8]
const WANGSHEN_IDX = [11,5,8,2]
const ZAISHA_IDX   = [6,0,3,9]

const HONGYASHA = { 甲:6,乙:6,丙:2,丁:7,戊:4,己:4,庚:10,辛:9,壬:0,癸:8 }

// 天德/月德以月令为准，寅月为正月。
const TIANDE_BY_MONTH_ZHI = { 寅:'丁',卯:'申',辰:'壬',巳:'辛',午:'亥',未:'甲',申:'癸',酉:'寅',戌:'丙',亥:'乙',子:'巳',丑:'庚' }
const YUEDE_BY_MONTH_GROUP = { 1:'丙',0:'壬',3:'甲',2:'庚' }
const GAN_HE = { 甲:'己',己:'甲',乙:'庚',庚:'乙',丙:'辛',辛:'丙',丁:'壬',壬:'丁',戊:'癸',癸:'戊' }
const ZHI_HE = { 子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午' }
const HONG_LUAN = { 子:'卯',丑:'寅',寅:'丑',卯:'子',辰:'亥',巳:'戌',午:'酉',未:'申',申:'未',酉:'午',戌:'巳',亥:'辰' }
const TIAN_XI = Object.fromEntries(Object.entries(HONG_LUAN).map(([zhi, hong]) => [zhi, ZHI[(ZHI.indexOf(hong) + 6) % 12]]))
const GUCHEN = { 子:'寅',丑:'寅',亥:'寅', 寅:'巳',卯:'巳',辰:'巳', 巳:'申',午:'申',未:'申', 申:'亥',酉:'亥',戌:'亥' }
const GUASU = { 子:'戌',丑:'戌',亥:'戌', 寅:'丑',卯:'丑',辰:'丑', 巳:'辰',午:'辰',未:'辰', 申:'未',酉:'未',戌:'未' }
const YUANCHEN = { 子:'未',丑:'申',寅:'酉',卯:'戌',辰:'亥',巳:'戌',午:'丑',未:'子',申:'卯',酉:'寅',戌:'巳',亥:'辰' }
const DEXIU_GROUP_RULES = {
  0: { de:['壬','癸','戊','己'], xiu:['丙','辛','甲','己'] },
  1: { de:['丙','丁'], xiu:['戊','癸'] },
  2: { de:['庚','辛'], xiu:['乙','庚'] },
  3: { de:['甲','乙'], xiu:['丁','壬'] }
}

function pushUnique(list, value) {
  if (value && !list.includes(value)) list.push(value)
}

function hasIdx(table, gan, zi) {
  const value = table[gan]
  return Array.isArray(value) ? value.includes(zi) : value === zi
}

function matchMonthStar(rule, gan, zhi) {
  if (!rule) return false
  return GAN.includes(rule) ? gan === rule : zhi === rule
}

function matchMonthStarHe(rule, gan, zhi) {
  if (!rule) return false
  return GAN.includes(rule) ? gan === GAN_HE[rule] : zhi === ZHI_HE[rule]
}

export function getShenSha(dayGan, yearZhi, dayZhi, monthZhi, yearGan = '') {
  const basisGans = [dayGan, yearGan].filter(Boolean)
  const basisZhiGroups = [getSanHe(dayZhi), getSanHe(yearZhi)].filter(v => v !== undefined)
  const deXiuRule = DEXIU_GROUP_RULES[getSanHe(monthZhi)]
  const isDeXiuChart = !!deXiuRule && [...deXiuRule.de, ...deXiuRule.xiu].includes(dayGan)
  const monthTianDe = TIANDE_BY_MONTH_ZHI[monthZhi]
  const monthYueDe = YUEDE_BY_MONTH_GROUP[getSanHe(monthZhi)]
  const dayXunKong = getXunKong(dayGan + dayZhi)

  // Returns shensha array for a given pillar/branch column.
  function forZhi(zhi, gan = '') {
    const result = []
    const zi = ZHI.indexOf(zhi)

    basisGans.forEach(bg => {
      if ((TIANYI[bg] || []).includes(zi)) pushUnique(result, '天乙贵人')
      if (hasIdx(WENCHANG, bg, zi)) pushUnique(result, '文昌贵人')
      if (hasIdx(TIANZHU, bg, zi)) pushUnique(result, '天厨贵人')
      if (hasIdx(TAIJI, bg, zi)) pushUnique(result, '太极贵人')
      if (hasIdx(FUXING, bg, zi)) pushUnique(result, '福星贵人')
      if (hasIdx(GUOYIN, bg, zi)) pushUnique(result, '国印贵人')
      if (hasIdx(JINYU, bg, zi)) pushUnique(result, '金舆')
    })
    if (hasIdx(LIUXIA, dayGan, zi)) pushUnique(result, '流霞')
    if (hasIdx(XUETANG, dayGan, zi)) pushUnique(result, '学堂')
    if (hasIdx(CIGUAN, dayGan, zi)) pushUnique(result, '词馆')

    if (hasIdx(LU, dayGan, zi)) pushUnique(result, '禄神')
    if (hasIdx(YANGREN, dayGan, zi)) pushUnique(result, '羊刃')
    if (hasIdx(FEIREN, dayGan, zi)) pushUnique(result, '飞刃')
    if (hasIdx(XUEREN, dayGan, zi)) pushUnique(result, '血刃')
    if (hasIdx(HONGYASHA, dayGan, zi)) pushUnique(result, '红艳煞')

    basisZhiGroups.forEach(group => {
      if (ZHI[TAOHUA_IDX[group]] === zhi) pushUnique(result, '桃花')
      if (ZHI[YIMA_IDX[group]] === zhi) pushUnique(result, '驿马')
      if (ZHI[JIANXING_IDX[group]] === zhi) pushUnique(result, '将星')
      if (ZHI[HUAGAI_IDX[group]] === zhi) pushUnique(result, '华盖')
      if (ZHI[JIESHA_IDX[group]] === zhi) pushUnique(result, '劫煞')
      if (ZHI[WANGSHEN_IDX[group]] === zhi) pushUnique(result, '亡神')
      if (ZHI[ZAISHA_IDX[group]] === zhi) pushUnique(result, '灾煞')
    })

    if (isDeXiuChart) pushUnique(result, '德秀贵人')
    if (matchMonthStar(monthTianDe, gan, zhi)) pushUnique(result, '天德贵人')
    if (matchMonthStarHe(monthTianDe, gan, zhi)) pushUnique(result, '天德合')
    if (matchMonthStar(monthYueDe, gan, zhi)) pushUnique(result, '月德贵人')
    if (matchMonthStarHe(monthYueDe, gan, zhi)) pushUnique(result, '月德合')

    if (HONG_LUAN[yearZhi] === zhi) pushUnique(result, '红鸾')
    if (TIAN_XI[yearZhi] === zhi) pushUnique(result, '天喜')
    if (GUCHEN[yearZhi] === zhi) pushUnique(result, '孤辰')
    if (GUASU[yearZhi] === zhi) pushUnique(result, '寡宿')
    if (YUANCHEN[yearZhi] === zhi) pushUnique(result, '元辰')
    if (ZHI[(ZHI.indexOf(yearZhi) + 2) % 12] === zhi) pushUnique(result, '丧门')
    if (ZHI[(ZHI.indexOf(yearZhi) + 10) % 12] === zhi) pushUnique(result, '吊客')
    if (ZHI[(ZHI.indexOf(yearZhi) + 9) % 12] === zhi) pushUnique(result, '披麻')
    if (['辰', '巳'].includes(zhi)) pushUnique(result, '天罗地网')
    if (dayXunKong.includes(zhi)) pushUnique(result, '空亡')

    return result
  }
  return forZhi
}

// 纳音 nayin table
const NAYIN = [
  '海中金','炉中火','大林木','路旁土','剑锋金','山头火','涧下水','城头土','白蜡金','杨柳木',
  '泉中水','屋上土','霹雳火','松柏木','长流水','沙中金','山下火','平地木','壁上土','金箔金',
  '覆灯火','天河水','大驿土','钗钏金','桑柘木','大溪水','沙中土','天上火','石榴木','大海水'
]
export function getNaYin(ganZhi) {
  const g = GAN.indexOf(ganZhi[0])
  const z = ZHI.indexOf(ganZhi[1])
  if (g < 0 || z < 0) return ''
  const idx = Math.floor((g * 6 + z) / 2)
  return NAYIN[idx % 30]
}

// Get 天干 color for display
export function ganColor(gan) {
  const colors = { 甲:'#3c8a2e',乙:'#3c8a2e',丙:'#c0392b',丁:'#c0392b',戊:'#a0522d',己:'#a0522d',庚:'#888',辛:'#888',壬:'#2271b8',癸:'#2271b8' }
  return colors[gan] || '#333'
}
export function zhiColor(zhi) {
  const WX = { 子:'水',亥:'水',寅:'木',卯:'木',辰:'土',戌:'土',丑:'土',未:'土',午:'火',巳:'火',申:'金',酉:'金' }
  const colors = { 水:'#2271b8',木:'#3c8a2e',土:'#a0522d',火:'#c0392b',金:'#888' }
  return colors[WX[zhi]] || '#333'
}
export function ssColor(ss) {
  const pos = ['比肩','劫财','食神','伤官','日主']
  const neg = ['七杀','正官']
  const rich = ['偏财','正财']
  const print = ['偏印','正印']
  if (pos.includes(ss)) return '#c0392b'
  if (neg.includes(ss)) return '#2271b8'
  if (rich.includes(ss)) return '#a0522d'
  if (print.includes(ss)) return '#3c8a2e'
  return '#888'
}

export function calculateBazi(year, month, day, hour, minute, second, gender) {
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, second || 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()
  ec.setSect(2)

  const yearGan = ec.getYearGan()
  const yearZhi = ec.getYearZhi()
  const monthGan = ec.getMonthGan()
  const monthZhi = ec.getMonthZhi()
  const dayGan = ec.getDayGan()
  const dayZhi = ec.getDayZhi()
  const timeGan = ec.getTimeGan()
  const timeZhi = ec.getTimeZhi()

  // 大运
  const yun = ec.getYun(gender, 2)
  const startYear = yun.getStartYear()
  const startMonth = yun.getStartMonth()
  const startDay = yun.getStartDay()
  const dayunList = yun.getDaYun()

  const shenShaFor = getShenSha(dayGan, yearZhi, dayZhi, monthZhi, yearGan)

  // Build pillars
  const pillars = [
    { label: '年柱', gan: yearGan, zhi: yearZhi, ss: ec.getYearShiShenGan(), zhiSS: ec.getYearShiShenZhi(), hideGan: ec.getYearHideGan(), diShi: ec.getYearDiShi(), ziZuo: getDiShi(yearGan, yearZhi), xunKong: ec.getYearXunKong(), naYin: ec.getYearNaYin(), shenSha: shenShaFor(yearZhi, yearGan) },
    { label: '月柱', gan: monthGan, zhi: monthZhi, ss: ec.getMonthShiShenGan(), zhiSS: ec.getMonthShiShenZhi(), hideGan: ec.getMonthHideGan(), diShi: ec.getMonthDiShi(), ziZuo: getDiShi(monthGan, monthZhi), xunKong: ec.getMonthXunKong(), naYin: ec.getMonthNaYin(), shenSha: shenShaFor(monthZhi, monthGan) },
    { label: '日柱', gan: dayGan, zhi: dayZhi, ss: gender === 1 ? '元男' : '元女', zhiSS: ec.getDayShiShenZhi(), hideGan: ec.getDayHideGan(), diShi: ec.getDayDiShi(), ziZuo: getDiShi(dayGan, dayZhi), xunKong: ec.getDayXunKong(), naYin: ec.getDayNaYin(), shenSha: shenShaFor(dayZhi, dayGan) },
    { label: '时柱', gan: timeGan, zhi: timeZhi, ss: ec.getTimeShiShenGan(), zhiSS: ec.getTimeShiShenZhi(), hideGan: ec.getTimeHideGan(), diShi: ec.getTimeDiShi(), ziZuo: getDiShi(timeGan, timeZhi), xunKong: ec.getTimeXunKong(), naYin: ec.getTimeNaYin(), shenSha: shenShaFor(timeZhi, timeGan) }
  ]

  // Build 大运 list
  const dayuns = []
  for (let i = 1; i < dayunList.length; i++) {
    const dy = dayunList[i]
    const gz = dy.getGanZhi()
    if (!gz) continue
    const dyGan = gz[0], dyZhi = gz[1]
    const liunian = dy.getLiuNian()
    const xiaoyun = dy.getXiaoYun()
    dayuns.push({
      ganZhi: gz,
      gan: dyGan,
      zhi: dyZhi,
      ss: getShiShen(dayGan, dyGan),
      zhiSS: getShiShen(dayGan, (ec.getDayHideGan()[0] || dyZhi)),
      diShi: getDiShi(dayGan, dyZhi),
      ziZuo: getDiShi(dyGan, dyZhi),
      startAge: dy.getStartAge(),
      startYear: dy.getStartYear(),
      naYin: getNaYin(gz),
      shenSha: shenShaFor(dyZhi, dyGan),
      liunian: liunian.map(ln => {
        const lnGz = ln.getGanZhi()
        return {
          year: ln.getYear(),
          ganZhi: lnGz,
          gan: lnGz[0],
          zhi: lnGz[1],
          ss: getShiShen(dayGan, lnGz[0]),
          zhiSS: getShiShen(dayGan, getMainHideGan(lnGz[1])),
          shenSha: shenShaFor(lnGz[1], lnGz[0])
        }
      }),
      xiaoyun: xiaoyun.map(xy => {
        const xyGz = xy.getGanZhi()
        return {
          year: xy.getYear(),
          age: xy.getAge(),
          ganZhi: xyGz,
          gan: xyGz[0],
          zhi: xyGz[1],
          ss: getShiShen(dayGan, xyGz[0]),
          zhiSS: getShiShen(dayGan, getMainHideGan(xyGz[1])),
          shenSha: shenShaFor(xyGz[1], xyGz[0])
        }
      })
    })
  }

  // Today's 四柱
  const todaySolar = Solar.fromDate(new Date())
  const todayLunar = todaySolar.getLunar()
  const todayEc = todayLunar.getEightChar()
  todayEc.setSect(2)
  const todayYear = todaySolar.getYear()

  // Find current 大运 index
  let currentDayunIdx = 0
  for (let i = 0; i < dayuns.length; i++) {
    if (dayuns[i].startYear <= todayYear) currentDayunIdx = i
    else break
  }
  const currentDayun = dayuns[currentDayunIdx]

  // 流年十神 (today's year stem vs dayGan)
  const lyGan = todayEc.getYearGan()
  const lyZhi = todayEc.getYearZhi()
  const lyDiShi = getDiShi(dayGan, lyZhi)
  const lyZiZuo = getDiShi(lyGan, lyZhi)
  const lyXunKong = todayEc.getYearXunKong()

  // Current major/minor cycle for display in the main table
  const dyGan = currentDayun?.gan || ''
  const dyZhi = currentDayun?.zhi || ''

  return {
    solar: { year, month, day, hour, minute },
    lunarDesc: `${lunar.getYear()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${lunar.getTimeZhi()}时`,
    gender,
    dayGan,
    pillars,
    // Columns for main table: [流年, 大运, 年柱, 月柱, 日柱, 时柱]
    tableColumns: [
      {
        label: '流年',
        gan: lyGan,
        zhi: lyZhi,
        ss: getShiShen(dayGan, lyGan),
        zhiSS: getShiShen(dayGan, getMainHideGan(lyZhi)),
        hideGan: getHideGan(lyZhi),
        diShi: lyDiShi,
        ziZuo: lyZiZuo,
        xunKong: lyXunKong,
        naYin: getNaYin(lyGan + lyZhi),
        shenSha: shenShaFor(lyZhi, lyGan)
      },
      {
        label: '大运',
        gan: dyGan,
        zhi: dyZhi,
        ss: getShiShen(dayGan, dyGan),
        zhiSS: getShiShen(dayGan, getMainHideGan(dyZhi)),
        hideGan: getHideGan(dyZhi),
        diShi: getDiShi(dayGan, dyZhi),
        ziZuo: getDiShi(dyGan, dyZhi),
        xunKong: getXunKong(dyGan + dyZhi),
        naYin: getNaYin(dyGan + dyZhi),
        shenSha: shenShaFor(dyZhi, dyGan)
      },
      ...pillars
    ],
    dayuns,
    currentDayunIdx,
    qiYun: { year: startYear, month: startMonth, day: startDay },
    taiYuan: ec.getTaiYuan(),
    taiXi: ec.getTaiXi(),
    mingGong: ec.getMingGong(),
    shenGong: ec.getShenGong(),
    todayYear,
    currentAge: todayYear - year
  }
}

// Hidden stem lookup table
const HIDE_GAN = {
  子:['癸'],丑:['己','癸','辛'],寅:['甲','丙','戊'],卯:['乙'],
  辰:['戊','乙','癸'],巳:['丙','庚','戊'],午:['丁','己'],未:['己','丁','乙'],
  申:['庚','壬','戊'],酉:['辛'],戌:['戊','辛','丁'],亥:['壬','甲']
}
export function getHideGan(zhi) { return HIDE_GAN[zhi] || [] }
export function getMainHideGan(zhi) { return (HIDE_GAN[zhi] || [])[0] || '' }

// 旬 lookup for XunKong
const XUN_TABLE = [
  {gans:['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'], startZhi:0, kong:'戌亥'},
]
const XUN_DATA = [
  {start:'甲子', kong:'戌亥'},{start:'甲戌', kong:'申酉'},{start:'甲申', kong:'午未'},
  {start:'甲午', kong:'辰巳'},{start:'甲辰', kong:'寅卯'},{start:'甲寅', kong:'子丑'}
]
export function getXunKong(ganZhi) {
  if (!ganZhi || ganZhi.length < 2) return ''
  const gi = GAN.indexOf(ganZhi[0])
  const zi = ZHI.indexOf(ganZhi[1])
  if (gi < 0 || zi < 0) return ''
  let combined = -1
  for (let i = 0; i < 60; i++) {
    if (GAN[i % 10] === ganZhi[0] && ZHI[i % 12] === ganZhi[1]) {
      combined = i
      break
    }
  }
  if (combined < 0) return ''
  const xunGroupStart = combined - (combined % 10)
  const z1 = (xunGroupStart + 10) % 12
  const z2 = (xunGroupStart + 11) % 12
  return ZHI[z1] + ZHI[z2]
}

// 五行 display colors (for WuXing indicators)
export function wuXingOf(gan) { return GAN_WX[gan] || '' }
