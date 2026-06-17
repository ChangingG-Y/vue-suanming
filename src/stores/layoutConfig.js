import { defineStore } from 'pinia'
import { ref } from 'vue'

const DEFAULTS = {
  loginEmoji: '🍱',
  loginTitle: '小新补给站🍱(๑´ڡ`๑)',
  loginSub: '今天想吃点什么呀~',
  loginBtn: '进入小新补给站',
  tab0Icon: '🍱',
  tab0Label: '点饭饭',
  tab1Icon: '🍖',
  tab1Label: '小碗里',
  tab2Icon: '📖',
  tab2Label: '干饭史',
  adminTitle: '小新补给站 管理',
  successMsg: '下单成功！等待接单 🍳',
  calEmojiCooking: '🍳',
  calEmojiDining: '🍜',
  calEmojiDiary: '📝',
  calLabelCooking: '做饭',
  calLabelDining: '下馆子',
  calLabelDiary: '日记',
}

export const useLayoutConfigStore = defineStore('layoutConfig', () => {
  const config = ref({ ...DEFAULTS })
  const loaded = ref(false)

  function setConfig(data) {
    config.value = { ...DEFAULTS, ...data }
    loaded.value = true
    applyDocumentTitle()
  }

  function applyDocumentTitle() {
    const title = config.value.loginTitle || DEFAULTS.loginTitle
    document.title = title
  }

  function reset() {
    config.value = { ...DEFAULTS }
    loaded.value = false
    applyDocumentTitle()
  }

  return { config, loaded, setConfig, reset, applyDocumentTitle }
})
