import { useCallback, useEffect, useMemo, useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import type { Location, LocationType, LocationAvailabilityResponse, LocationAvailability, LocationStats } from '@/types/location'
import { apiFetch } from '@/lib/api'
import { useStore } from '@/context/StoreContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LocationFilters } from '@/components/locations/LocationFilters'
import { LocationGrid } from '@/components/locations/LocationGrid'
import { LocationTable } from '@/components/locations/LocationTable'

type ViewMode = 'grid' | 'table'

export function LocationsPage() {
  const { current: store } = useStore()
  const [locations, setLocations] = useState<Location[]>([])
  const [availability, setAvailability] = useState<LocationAvailability[]>([])
  const [stats, setStats] = useState<LocationStats[]>([])
  const [summary, setSummary] = useState<{ total: number; busy: number; free: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

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
      const [locData, availData, statsData] = await Promise.all([
        apiFetch<Location[]>(`/api/locations?store_id=${sid}`),
        apiFetch<LocationAvailabilityResponse>(`/api/locations/availability?store_id=${sid}`),
        apiFetch<LocationStats[]>(`/api/locations/stats?store_id=${sid}&days=30`),
      ])
      setLocations(locData)
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

  // merge stats into availability for display
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

  const filteredLocations = useMemo(() => {
    let list = locations
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((l) => l.label.toLowerCase().includes(q))
    }
    if (type !== 'all') {
      list = list.filter((l) => l.type === type)
    }
    if (occupancy === 'busy') {
      list = list.filter((l) => l.is_occupied)
    } else if (occupancy === 'free') {
      list = list.filter((l) => !l.is_occupied)
    }
    return list
  }, [locations, search, type, occupancy])

  const handleClear = () => {
    setSearch('')
    setType('all')
    setOccupancy('all')
  }

  const chairCount = availability.filter((l) => l.type === 'chair').length
  const bedCount = availability.filter((l) => l.type === 'bed').length

  return (
    <div className="space-y-6 p-6">
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">位置管理</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? '載入中…' : `共 ${availability.length} 個位置（腳位 ${chairCount} · 床位 ${bedCount}）`}
          </p>
        </div>

        {/* view toggle */}
        <div className="flex rounded-lg border">
          <Button
            variant="ghost" size="sm"
            className={cn('rounded-r-none', viewMode === 'grid' && 'bg-muted')}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="sm"
            className={cn('rounded-l-none', viewMode === 'table' && 'bg-muted')}
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="全部位置" value={summary.total} />
          <SummaryCard label="空閒" value={summary.free} color="text-green-600" />
          <SummaryCard label="使用中" value={summary.busy} color="text-red-600" />
        </div>
      )}

      {/* filters */}
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

      {/* content */}
      {viewMode === 'grid' ? (
        <LocationGrid locations={filteredAvailability} loading={loading} />
      ) : (
        <LocationTable locations={filteredLocations} loading={loading} />
      )}

      {/* stats section */}
      {!loading && stats.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">近 30 天使用統計</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {stats
              .filter((s) => s.session_count > 0)
              .sort((a, b) => b.session_count - a.session_count)
              .map((s) => (
                <div key={s.location_id} className="rounded-lg border px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{s.label}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {s.type === 'chair' ? '腳' : '床'}
                    </span>
                  </div>
                  <p className="text-lg font-bold tabular-nums">{s.session_count}</p>
                  <p className="text-xs text-muted-foreground">{Math.round(s.total_minutes / 60)}h</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
    </div>
  )
}
