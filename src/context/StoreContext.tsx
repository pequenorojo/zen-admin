import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Store } from '@/types/store'
import { apiFetch } from '@/lib/api'

interface StoreContextValue {
  stores: Store[]
  current: Store | null
  setCurrent: (store: Store) => void
  loading: boolean
}

const StoreContext = createContext<StoreContextValue>({
  stores: [],
  current: null,
  setCurrent: () => {},
  loading: true,
})

export function StoreProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<Store[]>([])
  const [current, setCurrent] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<Store[]>('/api/stores')
      .then((data) => {
        setStores(data)
        // restore last selection or default to first
        const saved = localStorage.getItem('zen-admin-store-id')
        const match = data.find((s) => s.id === saved)
        setCurrent(match ?? data[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSetCurrent = (store: Store) => {
    setCurrent(store)
    localStorage.setItem('zen-admin-store-id', store.id)
  }

  return (
    <StoreContext.Provider value={{ stores, current, setCurrent: handleSetCurrent, loading }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
