import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { Eye, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { Customer } from '@/types/customer'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { MembershipBadge } from './MembershipBadge'

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'yyyy/MM/dd', { locale: zhTW })
}

interface Props {
  customers: Customer[]
  loading?: boolean
  onSelect: (customer: Customer) => void
}

export function CustomerTable({ customers, loading, onSelect }: Props) {
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
        沒有符合條件的客戶紀錄
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[100px]">姓名</TableHead>
              <TableHead className="w-[60px] text-center">性別</TableHead>
              <TableHead className="w-[120px]">電話</TableHead>
              <TableHead className="w-[80px] text-center">等級</TableHead>
              <TableHead className="w-[70px] text-right">積分</TableHead>
              <TableHead className="w-[70px] text-right">造訪</TableHead>
              <TableHead className="w-[100px]">最後造訪</TableHead>
              <TableHead className="w-[100px]">註冊日期</TableHead>
              <TableHead className="w-[60px] text-center">狀態</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => onSelect(c)}>
                <TableCell className="font-medium">
                  {c.name}
                  {c.referrer_name && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-1 text-xs text-muted-foreground">*</span>
                      </TooltipTrigger>
                      <TooltipContent>推薦人：{c.referrer_name}</TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell className="text-center">{c.gender ?? '—'}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{c.phone}</TableCell>
                <TableCell className="text-center">
                  <MembershipBadge level={c.membership_level} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{c.points_balance}</TableCell>
                <TableCell className="text-right tabular-nums">{c.total_visits}</TableCell>
                <TableCell className="text-muted-foreground">{fmtDate(c.last_visit_at)}</TableCell>
                <TableCell className="text-muted-foreground">{fmtDate(c.created_at)}</TableCell>
                <TableCell className="text-center">
                  {c.is_blacklisted ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ShieldAlert className="mx-auto h-4 w-4 text-destructive" />
                      </TooltipTrigger>
                      <TooltipContent>
                        黑名單{c.blacklist_scope ? `（${c.blacklist_scope}${c.blacklist_target_name ? `：${c.blacklist_target_name}` : ''}）` : ''}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <ShieldCheck className="mx-auto h-4 w-4 text-green-500" />
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => { e.stopPropagation(); onSelect(c) }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
