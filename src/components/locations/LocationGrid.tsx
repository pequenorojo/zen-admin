import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { Armchair, BedDouble, Box } from 'lucide-react'
import type { LocationAvailability } from '@/types/location'
import { cn } from '@/lib/utils'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'

function fmt(iso: string | null) {
  if (!iso) return ''
  return format(new Date(iso), 'HH:mm', { locale: zhTW })
}

const TYPE_ICON = {
  chair: Armchair,
  bed: BedDouble,
  other: Box,
} as const

interface Props {
  locations: LocationAvailability[]
  loading?: boolean
}

export function LocationGrid({ locations, loading }: Props) {
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
    <TooltipProvider>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {locations.map((loc) => {
          const Icon = TYPE_ICON[loc.type] ?? Box
          const busy = loc.seat_occupied_now

          return (
            <Tooltip key={loc.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors',
                    busy
                      ? 'border-red-200 bg-red-50'
                      : 'border-green-200 bg-green-50',
                  )}
                >
                  <Icon className={cn('h-7 w-7', busy ? 'text-red-500' : 'text-green-600')} />
                  <p className="text-sm font-semibold">{loc.label}</p>
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium',
                    busy ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700',
                  )}>
                    {busy ? '使用中' : '空閒'}
                  </span>

                  {busy && loc.customer_name && (
                    <p className="text-xs text-muted-foreground truncate max-w-full">
                      {loc.customer_name}
                    </p>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px]">
                <div className="space-y-1 text-xs">
                  <p className="font-medium">{loc.label} · {loc.type === 'chair' ? '腳位' : loc.type === 'bed' ? '床位' : '其他'}</p>
                  {loc.floor > 1 && <p>{loc.floor}F</p>}
                  {loc.room && <p>房間：{loc.room}</p>}
                  {busy ? (
                    <>
                      <p>客戶：{loc.customer_name}</p>
                      <p>服務：{loc.service_name}</p>
                      <p>師傅：{loc.therapist_name}</p>
                      {loc.appt_scheduled_at && <p>開始：{fmt(loc.appt_scheduled_at)}</p>}
                      {loc.next_free_at && <p>預計空出：{fmt(loc.next_free_at)}</p>}
                    </>
                  ) : (
                    <p className="text-green-700">可使用</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
