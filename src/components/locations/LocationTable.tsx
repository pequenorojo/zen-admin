import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import type { Location } from '@/types/location'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { LocationTypeBadge } from './LocationTypeBadge'
import { cn } from '@/lib/utils'

function fmt(iso: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'MM/dd HH:mm', { locale: zhTW })
}

interface Props {
  locations: Location[]
  loading?: boolean
}

export function LocationTable({ locations, loading }: Props) {
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
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[80px]">標籤</TableHead>
              <TableHead className="w-[70px] text-center">類型</TableHead>
              <TableHead className="w-[50px] text-center">樓層</TableHead>
              <TableHead className="w-[80px]">房間</TableHead>
              <TableHead className="w-[80px] text-center">狀態</TableHead>
              <TableHead className="w-[90px]">目前師傅</TableHead>
              <TableHead>目前服務</TableHead>
              <TableHead className="w-[90px]">客戶</TableHead>
              <TableHead className="w-[110px]">預計空出</TableHead>
              <TableHead className="w-[60px] text-right">優先</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((loc) => (
              <TableRow key={loc.id}>
                <TableCell className="font-medium">{loc.label}</TableCell>
                <TableCell className="text-center">
                  <LocationTypeBadge type={loc.type} />
                </TableCell>
                <TableCell className="text-center">{loc.floor}F</TableCell>
                <TableCell className="text-muted-foreground">{loc.room || '—'}</TableCell>
                <TableCell className="text-center">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                    loc.is_occupied
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700',
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', loc.is_occupied ? 'bg-red-500' : 'bg-green-500')} />
                    {loc.is_occupied ? '使用中' : '空閒'}
                  </span>
                </TableCell>
                <TableCell>{loc.therapist_name ?? '—'}</TableCell>
                <TableCell>
                  {loc.service_name ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default">{loc.service_name}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{loc.appt_duration_min}min · {loc.appt_status}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{loc.customer_name ?? '—'}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {fmt(loc.expected_available_at)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{loc.priority_score}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
