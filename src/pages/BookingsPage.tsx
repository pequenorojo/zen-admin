import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import type { Booking, BookingStatus } from '@/types/booking'
import { apiFetch } from '@/lib/api'
import { useStore } from '@/context/StoreContext'
import { BookingFilters } from '@/components/bookings/BookingFilters'
import { BookingTable } from '@/components/bookings/BookingTable'

export function BookingsPage() {
  const { current: store } = useStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">預約管理</h1>
        <p className="text-sm text-muted-foreground">
          {loading ? '載入中…' : `共 ${filtered.length} 筆預約紀錄`}
        </p>
      </div>

      {/* Filters */}
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

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <BookingTable bookings={filtered} loading={loading} />
    </div>
  )
}
