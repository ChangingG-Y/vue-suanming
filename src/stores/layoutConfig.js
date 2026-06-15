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
}

export const useLayoutConfigStore = defineStore('layoutConfig', () => {
  const config = ref({ ...DEFAULTS })
  const loaded = ref(false)

  function setConfig(data) {
    config.value = { ...DEFAULTS, ...data }
    loaded.value = true
  }

  function reset() {
    config.value = { ...DEFAULTS }
    loaded.value = false
  }

  return { config, loaded, setConfig, reset }
})
