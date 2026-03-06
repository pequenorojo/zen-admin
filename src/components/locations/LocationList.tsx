import { Armchair, BedDouble } from 'lucide-react'
import type { LocationAvailability } from '@/types/location'
import { cn } from '@/lib/utils'

interface Props {
  locations: LocationAvailability[]
  loading?: boolean
  selectedId: string | null
  onSelect: (l: LocationAvailability) => void
}

export function LocationList({ locations, loading, selectedId, onSelect }: Props) {
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        載入中…
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        沒有符合條件的位置
      </div>
    )
  }

  return (
    <div className="divide-y">
      {locations.map((l) => {
        const busy = l.seat_occupied_now
        const Icon = l.type === 'bed' ? BedDouble : Armchair
        return (
          <div
            key={l.id}
            onClick={() => onSelect(l)}
            className={cn(
              'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50',
              selectedId === l.id && 'bg-accent',
            )}
          >
            <div className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              busy ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600',
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{l.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {l.type === 'chair' ? '腳位' : l.type === 'bed' ? '床位' : '其他'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {busy
                  ? `${l.customer_name ?? '—'} · ${l.service_name ?? ''}`
                  : '空閒'}
              </p>
            </div>
            <span className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
              busy ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700',
            )}>
              {busy ? '使用中' : '空閒'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
