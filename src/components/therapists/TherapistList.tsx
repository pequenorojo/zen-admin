import type { Therapist } from '@/types/therapist'
import { cn } from '@/lib/utils'
import { StatusDot } from './StatusIndicator'
import { TierBadge } from './TierBadge'

interface Props {
  therapists: Therapist[]
  loading?: boolean
  selectedId: string | null
  onSelect: (t: Therapist) => void
}

function getTodayTime(t: Therapist): string | null {
  const dow = new Date().getDay()
  const s = t.schedules.find((sc) => sc.day_of_week === dow)
  if (!s) return null
  return `${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}`
}

export function TherapistList({ therapists, loading, selectedId, onSelect }: Props) {
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
    <div className="divide-y">
      {therapists.map((t) => {
        const todayTime = getTodayTime(t)
        return (
          <div
            key={t.id}
            onClick={() => onSelect(t)}
            className={cn(
              'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50',
              selectedId === t.id && 'bg-accent',
            )}
          >
            <StatusDot status={t.current_status} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{t.name}</span>
                {t.gender && <span className="text-xs text-muted-foreground">{t.gender}</span>}
                <TierBadge tier={t.therapist_tier} />
              </div>
              <p className="text-xs text-muted-foreground">
                {t.employee_no && `#${t.employee_no}`}
                {todayTime ? ` · ${todayTime}` : ' · 今日休'}
              </p>
            </div>
            <div className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              <p>排位 {t.rank_score.toFixed(1)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
