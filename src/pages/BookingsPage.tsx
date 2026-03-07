import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import type { Booking, BookingStatus } from '@/types/booking'
import { apiFetch } from '@/lib/api'
import { useSSE } from '@/hooks/useSSE'
import { useStore } from '@/context/StoreContext'
import { BookingFilters } from '@/components/bookings/BookingFilters'
import { BookingList } from '@/components/bookings/BookingList'
import { BookingDetailPanel } from '@/components/bookings/BookingDetailPanel'

export function BookingsPage() {
  const { current: store } = useStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Booking | null>(null)

  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [status, setStatus] = useState<BookingStatus | 'all'>('all')

  const hasActiveFilters = search !== '' || dateRange !== undefined || status !== 'all'

  const fetchBookings = useCallback(async () => {
    if (!store) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('store_id', store.id)
      if (dateRange?.from) params.set('date_from', format(dateRange.from, 'yyyy-MM-dd'))
      if (dateRange?.to) params.set('date_to', format(dateRange.to, 'yyyy-MM-dd'))
      if (status !== 'all') params.set('status', status)

      const data = await apiFetch<Booking[]>(`/api/appointments?${params}`)
      setBookings(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }, [store, dateRange, status])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  // SSE — auto-refresh on appointment updates
  const SSE_EVENTS = useMemo(() => ['appointment:updated'], [])
  useSSE(SSE_EVENTS, fetchBookings)

  // Keep selected booking in sync after re-fetch
  useEffect(() => {
    if (selected) {
      const updated = bookings.find((b) => b.id === selected.id)
      if (updated) setSelected(updated)
      else setSelected(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings])

  // client-side text search (name / phone)
  const filtered = useMemo(() => {
    if (!search) return bookings
    const q = search.toLowerCase()
    return bookings.filter(
      (b) =>
        b.customer_name.toLowerCase().includes(q) ||
        b.customer_phone.replace(/-/g, '').includes(q.replace(/-/g, '')),
    )
  }, [bookings, search])

  const handleClear = () => {
    setSearch('')
    setDateRange(undefined)
    setStatus('all')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header + Filters */}
      <div className="shrink-0 space-y-4 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">預約管理</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? '載入中…' : `共 ${filtered.length} 筆預約紀錄`}
            </p>
          </div>
        </div>

        <BookingFilters
          search={search}
          onSearchChange={setSearch}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          status={status}
          onStatusChange={setStatus}
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
        <div className="w-[480px] shrink-0 overflow-y-auto border-r">
          <BookingList
            bookings={filtered}
            loading={loading}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
        </div>

        {/* Right: Detail */}
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="p-6">
              <BookingDetailPanel booking={selected} onStatusChanged={fetchBookings} />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>選擇一筆預約以查看詳情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
