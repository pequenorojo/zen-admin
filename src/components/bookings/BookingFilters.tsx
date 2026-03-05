import type { BookingStatus } from '@/types/booking'
import type { DateRange } from 'react-day-picker'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from './DateRangePicker'

const STATUS_OPTIONS: { value: BookingStatus | 'all'; label: string }[] = [
  { value: 'all',         label: '全部狀態' },
  { value: 'pending',     label: '待確認' },
  { value: 'confirmed',   label: '已確認' },
  { value: 'in_progress', label: '進行中' },
  { value: 'checked_in',  label: '已報到' },
  { value: 'completed',   label: '已完成' },
  { value: 'cancelled',   label: '已取消' },
  { value: 'no_show',     label: '未到' },
]

interface Props {
  search: string
  onSearchChange: (v: string) => void
  dateRange: DateRange | undefined
  onDateRangeChange: (v: DateRange | undefined) => void
  status: BookingStatus | 'all'
  onStatusChange: (v: BookingStatus | 'all') => void
  onClear: () => void
  hasActiveFilters: boolean
}

export function BookingFilters({
  search, onSearchChange,
  dateRange, onDateRangeChange,
  status, onStatusChange,
  onClear, hasActiveFilters,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative w-[260px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜尋客戶姓名或電話…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Date Range */}
      <DateRangePicker value={dateRange} onChange={onDateRangeChange} />

      {/* Status */}
      <Select value={status} onValueChange={(v) => onStatusChange(v as BookingStatus | 'all')}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
          <X className="mr-1 h-4 w-4" />
          清除篩選
        </Button>
      )}
    </div>
  )
}
