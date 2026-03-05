import type { LocationType } from '@/types/location'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const TYPE_OPTIONS: { value: LocationType | 'all'; label: string }[] = [
  { value: 'all',   label: '全部類型' },
  { value: 'chair', label: '腳位' },
  { value: 'bed',   label: '床位' },
  { value: 'other', label: '其他' },
]

const OCCUPANCY_OPTIONS = [
  { value: 'all',   label: '全部狀態' },
  { value: 'free',  label: '空閒' },
  { value: 'busy',  label: '使用中' },
]

interface Props {
  search: string
  onSearchChange: (v: string) => void
  type: LocationType | 'all'
  onTypeChange: (v: LocationType | 'all') => void
  occupancy: string
  onOccupancyChange: (v: string) => void
  onClear: () => void
  hasActiveFilters: boolean
}

export function LocationFilters({
  search, onSearchChange,
  type, onTypeChange,
  occupancy, onOccupancyChange,
  onClear, hasActiveFilters,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-[220px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜尋標籤…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={type} onValueChange={(v) => onTypeChange(v as LocationType | 'all')}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={occupancy} onValueChange={onOccupancyChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OCCUPANCY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
          <X className="mr-1 h-4 w-4" />
          清除篩選
        </Button>
      )}
    </div>
  )
}
