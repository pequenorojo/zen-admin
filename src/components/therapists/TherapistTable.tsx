import { Eye } from 'lucide-react'
import type { Therapist } from '@/types/therapist'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
} from '@/components/ui/tooltip'
import { StatusDot } from './StatusIndicator'
import { TierBadge } from './TierBadge'

interface Props {
  therapists: Therapist[]
  loading?: boolean
  onSelect: (t: Therapist) => void
}

export function TherapistTable({ therapists, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        載入中…
      </div>
    )
  }

  if (therapists.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        沒有符合條件的師傅
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[50px] text-center">狀態</TableHead>
              <TableHead className="w-[100px]">姓名</TableHead>
              <TableHead className="w-[70px]">工號</TableHead>
              <TableHead className="w-[50px] text-center">性別</TableHead>
              <TableHead className="w-[120px]">電話</TableHead>
              <TableHead>技能</TableHead>
              <TableHead className="w-[70px] text-center">等級</TableHead>
              <TableHead className="w-[60px] text-right">積分</TableHead>
              <TableHead className="w-[50px] text-right">評分</TableHead>
              <TableHead className="w-[60px] text-right">服務數</TableHead>
              <TableHead className="w-[70px] text-right">排位</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {therapists.map((t) => (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => onSelect(t)}>
                <TableCell className="text-center">
                  <StatusDot status={t.current_status} />
                </TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {t.employee_no ?? '—'}
                </TableCell>
                <TableCell className="text-center">{t.gender ?? '—'}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {t.phone ?? '—'}
                </TableCell>
                <TableCell>
                  {t.skills.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : t.skills.length <= 3 ? (
                    <span className="text-sm">
                      {t.skills.map((s) => s.name).join('、')}
                    </span>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default text-sm">
                          {t.skills.slice(0, 2).map((s) => s.name).join('、')}
                          <span className="ml-1 text-xs text-muted-foreground">+{t.skills.length - 2}</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t.skills.map((s) => s.name).join('、')}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <TierBadge tier={t.therapist_tier} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{t.therapist_points}</TableCell>
                <TableCell className="text-right tabular-nums">{t.rating}</TableCell>
                <TableCell className="text-right tabular-nums">{t.total_sessions}</TableCell>
                <TableCell className="text-right tabular-nums">{t.rank_score.toFixed(1)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost" size="sm" className="h-8 w-8 p-0"
                    onClick={(e) => { e.stopPropagation(); onSelect(t) }}
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
