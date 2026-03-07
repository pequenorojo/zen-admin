import { useEffect, useRef } from 'react'

const API_BASE = 'https://zen-api-2clxntdemq-de.a.run.app'
const API_KEY = 'zen-dev-key-2026'
const RECONNECT_DELAY = 5000

/**
 * Generic SSE hook — connects to the API event stream,
 * listens for specified event types, and calls onEvent callback.
 */
export function useSSE(eventTypes: string[], onEvent: () => void) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (eventTypes.length === 0) return

    let es: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let unmounted = false

    function connect() {
      if (unmounted) return
      es = new EventSource(`${API_BASE}/api/events/stream?key=${API_KEY}`)

      for (const eventType of eventTypes) {
        es.addEventListener(eventType, () => {
          onEventRef.current()
        })
      }

      es.onerror = () => {
        es?.close()
        if (!unmounted) {
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY)
        }
      }
    }

    connect()

    return () => {
      unmounted = true
      es?.close()
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }
    // Reconnect when eventTypes change (stable array reference expected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventTypes.join(',')])
}
