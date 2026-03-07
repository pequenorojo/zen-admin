import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LocationType, LocationAvailabilityResponse, LocationAvailability, LocationStats } from '@/types/location'
import { apiFetch } from '@/lib/api'
import { useSSE } from '@/hooks/useSSE'
import { useStore } from '@/context/StoreContext'
import { cn } from '@/lib/utils'
import { LocationFilters } from '@/components/locations/LocationFilters'
import { LocationList } from '@/components/locations/LocationList'
import { LocationDetailPanel } from '@/components/locations/LocationDetailPanel'

export function LocationsPage() {
  const { current: store } = useStore()
  const [availability, setAvailability] = useState<LocationAvailability[]>([])
  const [stats, setStats] = useState<LocationStats[]>([])
  const [summary, setSummary] = useState<{ total: number; busy: number; free: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<LocationAvailability | null>(null)

  const [search, setSearch] = useState('')
  const [type, setType] = useState<LocationType | 'all'>('all')
  const [occupancy, setOccupancy] = useState('all')

  const hasActiveFilters = search !== '' || type !== 'all' || occupancy !== 'all'

  const fetchData = useCallback(async () => {
    if (!store) return
    setLoading(true)
    setError(null)
    try {
      const sid = store.id
      const [availData, statsData] = await Promise.all([
        apiFetch<LocationAvailabilityResponse>(`/api/locations/availability?store_id=${sid}`),
        apiFetch<LocationStats[]>(`/api/locations/stats?store_id=${sid}&days=30`),
      ])
      setAvailability(availData.locations)
      setSummary(availData.summary)
      setStats(statsData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch locations')
    } finally {
      setLoading(false)
    }
  }, [store])

  useEffect(() => { fetchData() }, [fetchData])

  // SSE — auto-refresh on appointment updates
  const SSE_EVENTS = useMemo(() => ['appointment:updated'], [])
  useSSE(SSE_EVENTS, fetchData)

  const statsMap = useMemo(() => {
    const m = new Map<string, LocationStats>()
    stats.forEach((s) => m.set(s.location_id, s))
    return m
  }, [stats])

  const filteredAvailability = useMemo(() => {
    let list = availability
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((l) => l.label.toLowerCase().includes(q))
    }
    if (type !== 'all') {
      list = list.filter((l) => l.type === type)
    }
    if (occupancy === 'busy') {
      list = list.filter((l) => l.seat_occupied_now)
    } else if (occupancy === 'free') {
      list = list.filter((l) => !l.seat_occupied_now)
    }
    return list
  }, [availability, search, type, occupancy])

  const handleClear = () => {
    setSearch('')
    setType('all')
    setOccupancy('all')
  }

  const chairCount = availability.filter((l) => l.type === 'chair').length
  const bedCount = availability.filter((l) => l.type === 'bed').length

  return (
    <div className="flex h-full flex-col">
      {/* Header + Filters */}
      <div className="shrink-0 space-y-4 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">位置管理</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? '載入中…' : `共 ${availability.length} 個位置（腳位 ${chairCount} · 床位 ${bedCount}）`}
            </p>
          </div>

          {/* Summary chips */}
          {summary && (
            <div className="flex items-center gap-3">
              <SummaryChip label="全部" value={summary.total} />
              <SummaryChip label="空閒" value={summary.free} color="text-green-600" />
              <SummaryChip label="使用中" value={summary.busy} color="text-red-600" />
            </div>
          )}
        </div>

        <LocationFilters
          search={search}
          onSearchChange={setSearch}
          type={type}
          onTypeChange={setType}
          occupancy={occupancy}
          onOccupancyChange={setOccupancy}
          onClear={handleClear}
          hasActiveFilters={hasActiveFilters}
        />

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Master-Detail */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: List */}
        <div className="w-[360px] shrink-0 overflow-y-auto border-r">
          <LocationList
            locations={filteredAvailability}
            loading={loading}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
        </div>

        {/* Right: Detail */}
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="p-6">
              <LocationDetailPanel
                location={selected}
                stats={statsMap.get(selected.id)}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>選擇一個位置以查看詳情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryChip({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border px-3 py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-bold tabular-nums', color)}>{value}</span>
    </div>
  )
}
