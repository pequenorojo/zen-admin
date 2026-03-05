import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react'
import type { Booking } from '@/types/booking'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { StatusBadge } from './StatusBadge'

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return format(d, 'MM/dd (EEE) HH:mm', { locale: zhTW })
}

function TherapistCell({ booking }: { booking: Booking }) {
  if (!booking.therapist_name) {
    return <span className="text-muted-foreground">未指派</span>
  }
  const isDesignated = booking.therapist_preference === '指定'
  return (
    <span>
      {booking.therapist_name}
      {isDesignated && (
        <span className="ml-1 text-xs text-primary">[指]</span>
      )}
    </span>
  )
}

interface Props {
  bookings: Booking[]
  loading?: boolean
}

export function BookingTable({ bookings, loading }: Props) {
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
    <TooltipProvider>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[140px]">預約時間</TableHead>
              <TableHead className="w-[90px]">客戶</TableHead>
              <TableHead className="w-[120px]">電話</TableHead>
              <TableHead>服務項目</TableHead>
              <TableHead className="w-[100px]">師傅</TableHead>
              <TableHead className="w-[60px] text-center">時長</TableHead>
              <TableHead className="w-[80px] text-right">價格</TableHead>
              <TableHead className="w-[80px] text-center">狀態</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium tabular-nums">
                  {formatDateTime(b.scheduled_at)}
                </TableCell>
                <TableCell>{b.customer_name}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {b.customer_phone}
                </TableCell>
                <TableCell>
                  {b.notes ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default border-b border-dashed border-muted-foreground/40">
                          {b.service_name}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px] whitespace-pre-line">{b.notes}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    b.service_name
                  )}
                </TableCell>
                <TableCell>
                  <TherapistCell booking={b} />
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {b.duration_min}min
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  ${b.service_price}
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={b.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        檢視詳情
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        編輯
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        取消預約
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
