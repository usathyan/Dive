import React, { Suspense, lazy } from "react"

// Lazy load heavy components
const Mermaid = lazy(() => import("./preview/mermaid"))
const Html = lazy(() => import("./preview/html"))

interface CodePreviewProps {
  language: string
  code: string
}

const LoadingFallback = () => (
  <div style={{ padding: '8px', color: '#666', fontSize: '12px' }}>
    Loading preview...
  </div>
)

const CodePreview = ({ language, code }: CodePreviewProps) => {
  if (language === "mermaid") {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Mermaid chart={code} />
      </Suspense>
    )
  }

  if (language === "html" || language === "svg" || language === "xml") {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Html html={code} />
      </Suspense>
    )
  }

  return <></>
}

export default React.memo(CodePreview)