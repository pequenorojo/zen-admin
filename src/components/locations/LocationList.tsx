import { Armchair, BedDouble } from 'lucide-react'
import { format } from 'date-fns'
import type { LocationAvailability } from '@/types/location'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
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
            {busy && l.appt_id ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    使用中
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3 text-xs" side="left" align="start">
                  <div className="space-y-1.5">
                    <p className="font-semibold text-sm">訂單摘要</p>
                    <p><span className="text-muted-foreground">客戶：</span>{l.customer_name ?? '—'}</p>
                    <p><span className="text-muted-foreground">服務：</span>{l.service_name ?? '—'}</p>
                    <p><span className="text-muted-foreground">師傅：</span>{l.therapist_name ?? '—'}</p>
                    {l.appt_scheduled_at && (
                      <p><span className="text-muted-foreground">時間：</span>{format(new Date(l.appt_scheduled_at), 'HH:mm')}</p>
                    )}
                    {l.appt_duration_min != null && (
                      <p><span className="text-muted-foreground">時長：</span>{l.appt_duration_min} 分鐘</p>
                    )}
                    {l.next_free_at && (
                      <p><span className="text-muted-foreground">預計空出：</span>{format(new Date(l.next_free_at), 'HH:mm')}</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <span className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                busy ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700',
              )}>
                {busy ? '使用中' : '空閒'}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
