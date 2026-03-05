import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import type { Booking } from '@/types/booking'
import { cn } from '@/lib/utils'
import { StatusBadge } from './StatusBadge'

function formatDateTime(iso: string) {
  return format(new Date(iso), 'MM/dd (EEE) HH:mm', { locale: zhTW })
}

interface Props {
  bookings: Booking[]
  loading?: boolean
  selectedId: string | null
  onSelect: (b: Booking) => void
}

export function BookingList({ bookings, loading, selectedId, onSelect }: Props) {
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        載入中…
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        沒有符合條件的預約紀錄
      </div>
    )
  }

  return (
    <div className="divide-y">
      {bookings.map((b) => (
        <div
          key={b.id}
          onClick={() => onSelect(b)}
          className={cn(
            'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50',
            selectedId === b.id && 'bg-accent',
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{b.customer_name}</span>
              <StatusBadge status={b.status} />
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {b.service_name}
              {b.therapist_name && ` · ${b.therapist_name}`}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs tabular-nums font-medium">{formatDateTime(b.scheduled_at)}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{b.duration_min}min · ${b.service_price}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
