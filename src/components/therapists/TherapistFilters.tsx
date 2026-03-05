import type { CurrentStatus } from '@/types/therapist'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const STATUS_OPTIONS: { value: CurrentStatus | 'all'; label: string }[] = [
  { value: 'all',     label: '全部狀態' },
  { value: 'WHITE',   label: '待班中' },
  { value: 'YELLOW',  label: '等勞點' },
  { value: 'GREEN',   label: '休息中' },
  { value: 'RED',     label: '工作中' },
  { value: 'OFFLINE', label: '下線' },
]

const GENDER_OPTIONS = [
  { value: 'all', label: '全部性別' },
  { value: '男',  label: '男' },
  { value: '女',  label: '女' },
]

interface Props {
  search: string
  onSearchChange: (v: string) => void
  currentStatus: CurrentStatus | 'all'
  onCurrentStatusChange: (v: CurrentStatus | 'all') => void
  gender: string
  onGenderChange: (v: string) => void
  onClear: () => void
  hasActiveFilters: boolean
}

export function TherapistFilters({
  search, onSearchChange,
  currentStatus, onCurrentStatusChange,
  gender, onGenderChange,
  onClear, hasActiveFilters,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-[240px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜尋師傅姓名或工號…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={currentStatus} onValueChange={(v) => onCurrentStatusChange(v as CurrentStatus | 'all')}>
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={gender} onValueChange={onGenderChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GENDER_OPTIONS.map((opt) => (
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
