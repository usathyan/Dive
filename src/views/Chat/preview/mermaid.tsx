import React, { useEffect } from "react"

// Lazy import mermaid to reduce initial bundle size
let mermaid: any = null

const initializeMermaid = async () => {
  if (!mermaid) {
    const { default: mermaidModule } = await import("mermaid")
    mermaid = mermaidModule

    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
      themeCSS: `
        g.classGroup rect {
          fill: #282a36
          stroke: #6272a4
        }
        g.classGroup text {
          fill: #f8f8f2
        }
        g.classGroup line {
          stroke: #f8f8f2
          stroke-width: 0.5
        }
        .classLabel .box {
          stroke: #21222c
          stroke-width: 3
          fill: #21222c
          opacity: 1
        }
        .classLabel .label {
          fill: #f1fa8c
        }
        .relation {
          stroke: #ff79c6
          stroke-width: 1
        }
        #compositionStart, #compositionEnd {
          fill: #bd93f9
          stroke: #bd93f9
          stroke-width: 1
        }
        #aggregationEnd, #aggregationStart {
          fill: #21222c
          stroke: #50fa7b
          stroke-width: 1
        }
        #dependencyStart, #dependencyEnd {
          fill: #00bcd4
          stroke: #00bcd4
          stroke-width: 1
        }
        #extensionStart, #extensionEnd {
          fill: #f8f8f2
          stroke: #f8f8f2
          stroke-width: 1
        }`,
      fontFamily: "Fira Code"
    })
  }
}

const Mermaid = ({ chart }: { chart: string }) => {
  useEffect(() => {
    initializeMermaid().then(() => {
      if (mermaid) {
        mermaid.contentLoaded()
      }
    })
  }, [])

  return <div className="mermaid">{chart}</div>
}

export default React.memo(Mermaid)
