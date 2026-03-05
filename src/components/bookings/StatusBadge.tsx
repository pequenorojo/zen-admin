import type { BookingStatus } from '@/types/booking'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  pending:     { label: '待確認', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
  confirmed:   { label: '已確認', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  in_progress: { label: '進行中', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  checked_in:  { label: '已報到', className: 'bg-teal-100 text-teal-800 hover:bg-teal-100' },
  completed:   { label: '已完成', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
  cancelled:   { label: '已取消', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  no_show:     { label: '未到',   className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn('border-0 font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}
