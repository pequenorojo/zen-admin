import type { Customer } from '@/types/customer'
import { cn } from '@/lib/utils'
import { MembershipBadge } from './MembershipBadge'

interface Props {
  customers: Customer[]
  loading?: boolean
  selectedId: string | null
  onSelect: (c: Customer) => void
}

export function CustomerList({ customers, loading, selectedId, onSelect }: Props) {
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        載入中…
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        沒有符合條件的客戶
      </div>
    )
  }

  return (
    <div className="divide-y">
      {customers.map((c) => (
        <div
          key={c.id}
          onClick={() => onSelect(c)}
          className={cn(
            'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50',
            selectedId === c.id && 'bg-accent',
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {c.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{c.name}</span>
              {c.gender && <span className="text-xs text-muted-foreground">{c.gender}</span>}
              <MembershipBadge level={c.membership_level} />
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">{c.phone}</p>
          </div>
          {c.is_blacklisted && (
            <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
              黑名單
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
