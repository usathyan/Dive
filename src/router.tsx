import { createHashRouter } from "react-router-dom"
import { lazy, Suspense } from "react"

// Lazy load all heavy components
const Layout = lazy(() => import("./views/Layout"))
const Chat = lazy(() => import("./views/Chat"))
const Welcome = lazy(() => import("./views/Welcome"))
const Setup = lazy(() => import("./views/Setup"))

// Loading fallback component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '16px'
  }}>
    Loading...
  </div>
)

// Wrapper component with Suspense
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
)

export const router = createHashRouter([
  {
    path: "/",
    element: <SuspenseWrapper><Layout /></SuspenseWrapper>,
    children: [
      {
        index: true,
        element: <SuspenseWrapper><Welcome /></SuspenseWrapper>
      },
      {
        path: "chat",
        element: <SuspenseWrapper><Chat /></SuspenseWrapper>
      },
      {
        path: "chat/:chatId",
        element: <SuspenseWrapper><Chat /></SuspenseWrapper>
      },
      {
        path: "setup",
        element: <SuspenseWrapper><Setup /></SuspenseWrapper>
      }
    ]
  }
])
