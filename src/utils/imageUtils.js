const MAX_BYTES = 5 * 1024 * 1024  // 5 MB
const MAX_EDGE = 1200

export function prepareLifePhoto(file) {
  return new Promise(resolve => {
    const needsResize = file.size > MAX_BYTES
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img
      const tooLarge = width > MAX_EDGE || height > MAX_EDGE
      if (!needsResize && !tooLarge) { resolve(file); return }
      let w = width, h = height
      if (w >= h && (w > MAX_EDGE || needsResize)) { h = Math.round(h * MAX_EDGE / w); w = MAX_EDGE }
      else if (h > w && (h > MAX_EDGE || needsResize)) { w = Math.round(w * MAX_EDGE / h); h = MAX_EDGE }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob(resolve, 'image/jpeg', 0.88)
    }
    img.src = url
  })
}
