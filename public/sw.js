// 最小化 Service Worker，仅用于让 Chrome 认为可安装
// 不缓存任何内容，保证永远拿到最新数据
const VERSION = 'xnbgz-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', e => e.waitUntil(clients.claim()))

// 不拦截任何请求，纯透传
self.addEventListener('fetch', () => {})
