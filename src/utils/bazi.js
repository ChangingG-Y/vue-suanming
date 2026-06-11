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

// 神煞 lookup tables (based on day master or year/day branch)
const TIANYI = { 甲:[1,7],戊:[1,7],庚:[1,7],乙:[0,6],己:[0,6],丙:[11,9],丁:[11,9],壬:[3,5],癸:[3,5],辛:[6,2] }
const WENCHANG = { 甲:5,乙:6,丙:8,丁:9,戊:8,己:9,庚:11,辛:0,壬:2,癸:3 }
const TIANZHU = { 甲:5,乙:6,丙:2,丁:9,戊:8,己:11,庚:11,辛:11,壬:8,癸:5 }
const LU = { 甲:2,乙:3,丙:5,丁:6,戊:5,己:6,庚:8,辛:9,壬:11,癸:0 }
const YANGREN = { 甲:3,乙:2,丙:6,丁:5,戊:6,己:5,庚:9,辛:8,壬:0,癸:11 }
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

const HONGYASHA = { 甲:6,乙:6,丙:2,丁:7,戊:4,己:4,庚:10,辛:9,壬:0,癸:8 }

// 德秀贵人: based on month Zhi + dayGan combination (simplified: use month zhi check)
// 天德: 正月戌, 二月申, 三月壬, 四月辛, 五月亥, 六月甲, 七月癸, 八月寅, 九月丙, 十月乙, 十一月午, 十二月庚
const TIANDE_BY_MONTH = [10,8,'壬',9,11,'甲','癸',2,'丙','乙',6,'庚']
// 月德: 寅午戌月壬, 申子辰月庚, 亥卯未月甲, 巳酉丑月丙
const YUEDE = { 2:'壬',6:'壬',10:'壬', 0:'庚',8:'庚',4:'庚', 11:'甲',3:'甲',7:'甲', 5:'丙',9:'丙',1:'丙' }

export function getShenSha(dayGan, yearZhi, dayZhi, monthZhi) {
  // Returns shensha array for a given zhi column
  function forZhi(zhi) {
    const result = []
    const zi = ZHI.indexOf(zhi)

    // 天乙贵人
    const ty = TIANYI[dayGan] || []
    if (ty.includes(zi)) result.push('天乙贵人')

    // 文昌贵人
    if (WENCHANG[dayGan] === zi) result.push('文昌贵人')

    // 天厨贵人
    if (TIANZHU[dayGan] === zi) result.push('天厨贵人')

    // 禄神
    if (LU[dayGan] === zi) result.push('禄神')

    // 羊刃
    if (YANGREN[dayGan] === zi) result.push('羊刃')

    // 桃花 (based on year zhi)
    const yg = getSanHe(yearZhi)
    if (yg !== undefined && ZHI.indexOf(ZHI[TAOHUA_IDX[yg]]) === zi) result.push('桃花')
    // 桃花 (based on day zhi)
    const dg = getSanHe(dayZhi)
    if (dg !== undefined && ZHI.indexOf(ZHI[TAOHUA_IDX[dg]]) === zi && !result.includes('桃花')) result.push('桃花')

    // 驿马
    if (dg !== undefined && ZHI[YIMA_IDX[dg]] === zhi) result.push('驿马')

    // 将星
    if (dg !== undefined && ZHI[JIANXING_IDX[dg]] === zhi) result.push('将星')

    // 华盖
    if (dg !== undefined && ZHI[HUAGAI_IDX[dg]] === zhi) result.push('华盖')

    // 劫煞
    if (dg !== undefined && ZHI[JIESHA_IDX[dg]] === zhi) result.push('劫煞')

    // 红艳煞
    if (HONGYASHA[dayGan] === zi) result.push('红艳煞')

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

  const shenShaFor = getShenSha(dayGan, yearZhi, dayZhi, monthZhi)

  // Build pillars
  const pillars = [
    { label: '年柱', gan: yearGan, zhi: yearZhi, ss: ec.getYearShiShenGan(), zhiSS: ec.getYearShiShenZhi(), hideGan: ec.getYearHideGan(), diShi: ec.getYearDiShi(), ziZuo: getDiShi(yearGan, yearZhi), xunKong: ec.getYearXunKong(), naYin: ec.getYearNaYin(), shenSha: shenShaFor(yearZhi) },
    { label: '月柱', gan: monthGan, zhi: monthZhi, ss: ec.getMonthShiShenGan(), zhiSS: ec.getMonthShiShenZhi(), hideGan: ec.getMonthHideGan(), diShi: ec.getMonthDiShi(), ziZuo: getDiShi(monthGan, monthZhi), xunKong: ec.getMonthXunKong(), naYin: ec.getMonthNaYin(), shenSha: shenShaFor(monthZhi) },
    { label: '日柱', gan: dayGan, zhi: dayZhi, ss: gender === 1 ? '元男' : '元女', zhiSS: ec.getDayShiShenZhi(), hideGan: ec.getDayHideGan(), diShi: ec.getDayDiShi(), ziZuo: getDiShi(dayGan, dayZhi), xunKong: ec.getDayXunKong(), naYin: ec.getDayNaYin(), shenSha: shenShaFor(dayZhi) },
    { label: '时柱', gan: timeGan, zhi: timeZhi, ss: ec.getTimeShiShenGan(), zhiSS: ec.getTimeShiShenZhi(), hideGan: ec.getTimeHideGan(), diShi: ec.getTimeDiShi(), ziZuo: getDiShi(timeGan, timeZhi), xunKong: ec.getTimeXunKong(), naYin: ec.getTimeNaYin(), shenSha: shenShaFor(timeZhi) }
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
      shenSha: shenShaFor(dyZhi),
      liunian: liunian.map(ln => {
        const lnGz = ln.getGanZhi()
        return {
          year: ln.getYear(),
          ganZhi: lnGz,
          gan: lnGz[0],
          zhi: lnGz[1],
          ss: getShiShen(dayGan, lnGz[0]),
          zhiSS: getShiShen(dayGan, getMainHideGan(lnGz[1]))
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
          zhiSS: getShiShen(dayGan, getMainHideGan(xyGz[1]))
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
        shenSha: shenShaFor(lyZhi)
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
        shenSha: shenShaFor(dyZhi)
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
  // Find which 旬
  const offset = ((zi - gi % 12 + 12) % 12)
  const xunStart = (gi - gi % 10) // decade start in gan
  const xunIdx = Math.floor(((gi + 60 - (zi - (gi % 2 === 0 ? 0 : 0))) % 60) / 10)
  // Simplified: compute by ganZhi combined index
  const combined = (gi * 12 + zi) % 60
  const xunGroupStart = combined - (combined % 10)
  const kongStart = (xunGroupStart + 10) % 60
  const z1 = kongStart % 12
  const z2 = (kongStart + 1) % 12
  return ZHI[z1] + ZHI[z2]
}

// 五行 display colors (for WuXing indicators)
export function wuXingOf(gan) { return GAN_WX[gan] || '' }
