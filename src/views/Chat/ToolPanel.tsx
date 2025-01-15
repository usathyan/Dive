import React from 'react'

export interface ToolCall {
  name: string
  arguments: any
}

export interface ToolResult {
  name: string
  result: any
}

interface ToolPanelProps {
  type: 'calls' | 'result'
  content: (ToolCall | ToolResult)[]
  name?: string
}

const ToolPanel: React.FC<ToolPanelProps> = ({ type, content, name }) => {
  return (
    <details className="tool-panel">
      <summary>
        {type === 'calls' ? (
          <>🛠 Tool Calls</>
        ) : (
          <>📊 Call Result from {name}</>
        )}
      </summary>
      <div className="tool-content">
        <pre>
          <code>{JSON.stringify(content, null, 2)}</code>
        </pre>
      </div>
    </details>
  )
}

export default React.memo(ToolPanel) 