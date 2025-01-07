interface EventMap {
  "code-streaming-start": undefined
  "code-streaming-end": undefined
  "code-streaming": {
    code: string
    language: string
  }
}

type EventName = keyof EventMap
type EventCallback<T extends EventName> = (data: EventMap[T]) => void

class EventBus {
  private readonly eventTarget: EventTarget

  constructor() {
    this.eventTarget = document.createElement("div")
  }

  on<T extends EventName>(eventName: T, callback: EventCallback<T>) {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent
      callback(customEvent.detail)
    }
    
    ;(callback as any)._handler = handler
    this.eventTarget.addEventListener(eventName, handler)
  }

  remove<T extends EventName>(eventName: T, callback: EventCallback<T>) {
    const handler = (callback as any)._handler
    if (handler) {
      this.eventTarget.removeEventListener(eventName, handler)
      delete (callback as any)._handler
    }
  }

  emit<T extends EventName>(eventName: T, data: EventMap[T]) {
    const event = new CustomEvent(eventName, { detail: data })
    this.eventTarget.dispatchEvent(event)
  }
}

export const eventBus = new EventBus()