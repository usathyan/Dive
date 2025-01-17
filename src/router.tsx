import { createBrowserRouter } from "react-router-dom"
import Layout from "./views/Layout"
import Chat from "./views/Chat"
import Welcome from "./views/Welcome"
import Tools from "./views/Tools"
import Setup from "./views/Setup"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Welcome />
      },
      {
        path: "chat",
        element: <Chat />
      },
      {
        path: "chat/:chatId",
        element: <Chat />
      },
      {
        path: "tools",
        element: <Tools />
      },
      {
        path: "setup",
        element: <Setup />
      }
    ]
  }
])
