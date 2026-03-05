import type { MembershipLevel } from '@/types/customer'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const MEMBERSHIP_OPTIONS: { value: MembershipLevel | 'all'; label: string }[] = [
  { value: 'all',  label: '全部等級' },
  { value: '銅',   label: '銅' },
  { value: '銀',   label: '銀' },
  { value: '金',   label: '金' },
  { value: '白金', label: '白金' },
  { value: '黑金', label: '黑金' },
]

const BLACKLIST_OPTIONS = [
  { value: 'all',   label: '全部狀態' },
  { value: 'false', label: '正常' },
  { value: 'true',  label: '黑名單' },
]

interface Props {
  search: string
  onSearchChange: (v: string) => void
  membership: MembershipLevel | 'all'
  onMembershipChange: (v: MembershipLevel | 'all') => void
  blacklisted: string
  onBlacklistedChange: (v: string) => void
  onClear: () => void
  hasActiveFilters: boolean
}

export function CustomerFilters({
  search, onSearchChange,
  membership, onMembershipChange,
  blacklisted, onBlacklistedChange,
  onClear, hasActiveFilters,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-[260px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜尋客戶姓名或電話…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={membership} onValueChange={(v) => onMembershipChange(v as MembershipLevel | 'all')}>
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MEMBERSHIP_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={blacklisted} onValueChange={onBlacklistedChange}>
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BLACKLIST_OPTIONS.map((opt) => (
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
