import type { CurrentStatus } from '@/types/therapist'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STATUS_CHIPS: { value: CurrentStatus; label: string; dot: string }[] = [
  { value: 'RED',     label: '工作中', dot: 'bg-red-500' },
  { value: 'WHITE',   label: '待班中', dot: 'bg-gray-400' },
  { value: 'YELLOW',  label: '等勞點', dot: 'bg-yellow-400' },
  { value: 'GREEN',   label: '休息中', dot: 'bg-green-500' },
  { value: 'OFFLINE', label: '下線',   dot: 'bg-gray-300' },
]

const GENDER_OPTIONS = [
  { value: 'all', label: '全部性別' },
  { value: '男',  label: '男' },
  { value: '女',  label: '女' },
]

interface Props {
  search: string
  onSearchChange: (v: string) => void
  selectedStatuses: Set<CurrentStatus>
  onToggleStatus: (s: CurrentStatus) => void
  gender: string
  onGenderChange: (v: string) => void
  onClear: () => void
  hasActiveFilters: boolean
}

export function TherapistFilters({
  search, onSearchChange,
  selectedStatuses, onToggleStatus,
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

      {/* Multi-select status chips */}
      <div className="flex items-center gap-1.5">
        {STATUS_CHIPS.map(({ value, label, dot }) => {
          const active = selectedStatuses.has(value)
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggleStatus(value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-transparent bg-muted/60 text-muted-foreground hover:bg-muted',
              )}
            >
              <span className={cn('h-2 w-2 rounded-full', dot)} />
              {label}
            </button>
          )
        })}
      </div>

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
