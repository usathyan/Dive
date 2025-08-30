function domReady(condition = ["complete", "interactive"]) {
  return new Promise(resolve => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener("readystatechange", () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent, child) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent, child) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child)
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function loading() {
  const className = "loaders-css__square-spin"
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement("style")
  const oDiv = document.createElement("div")

  oStyle.id = "app-loading-style"
  oStyle.innerHTML = styleContent
  oDiv.className = "app-loading-wrap"
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = loading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === "removeLoading" && removeLoading()
}

setTimeout(removeLoading, 120000)

// Performance optimization: Preload critical resources
const preloadCriticalResources = () => {
  // Preload critical fonts and assets with priority
  const criticalResources = [
    { url: '/assets/index-DMTyPHfp.css', as: 'style', priority: 'high' },
    { url: '/assets/Pretendard-Regular-BhrLQoBv.woff2', as: 'font', priority: 'high' },
    { url: '/assets/react-vendor.js', as: 'script', priority: 'high' },
    { url: '/assets/state.js', as: 'script', priority: 'high' },
    { url: '/assets/i18n.js', as: 'script', priority: 'high' }
  ]

  criticalResources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = resource.url
    link.as = resource.as

    if (resource.as === 'font') {
      link.type = 'font/woff2'
      link.crossOrigin = 'anonymous'
    }

    // Set fetch priority for modern browsers
    if ('fetchPriority' in link) {
      link.fetchPriority = resource.priority as any
    }

    document.head.appendChild(link)
  })

  // Prefetch non-critical resources for better caching
  const prefetchResources = [
    '/assets/ui-vendor.js',
    '/assets/utils.js',
    '/assets/markdown.js'
  ]

  prefetchResources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = resource
    document.head.appendChild(link)
  })
}

// Add performance observer for monitoring
const observePerformance = () => {
  if ('PerformanceObserver' in window) {
    // Monitor long tasks (>50ms)
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 100) {
          console.log('Long task detected:', entry.duration, 'ms')
        }
      }
    })
    longTaskObserver.observe({ entryTypes: ['longtask'] })

    // Monitor layout shifts
    const layoutShiftObserver = new PerformanceObserver((list) => {
      let clsValue = 0
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      }
      if (clsValue > 0.1) {
        console.log('High CLS detected:', clsValue)
      }
    })
    layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
  }
}

// Start preloading and monitoring after DOM is ready
domReady().then(() => {
  preloadCriticalResources()
  observePerformance()
})
