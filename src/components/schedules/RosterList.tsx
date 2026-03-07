import type { RosterTherapist, AttendanceDisplayStatus } from '@/types/schedule'
import { StatusDot } from '@/components/therapists/StatusIndicator'
import { cn } from '@/lib/utils'

const ATTENDANCE_STYLE: Record<AttendanceDisplayStatus, string> = {
  '已出勤':   'bg-green-100 text-green-700',
  '尚未出勤': 'bg-gray-100 text-gray-500',
  '下線':     'bg-orange-100 text-orange-700',
}

function formatTime(t: string) {
  return t.slice(0, 5) // "09:00:00" → "09:00"
}

interface Props {
  therapists: RosterTherapist[]
  loading: boolean
}

export function RosterList({ therapists, loading }: Props) {
  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">載入中…</div>
  }

  if (therapists.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">今日無排班師傅</div>
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-1 pr-1">
      {therapists.map((t) => (
        <div
          key={t.therapist_id}
          className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
        >
          <StatusDot status={t.current_status} />
          <span className="text-muted-foreground text-xs w-10 shrink-0">
            {t.employee_no ?? '—'}
          </span>
          <span className="font-medium truncate">{t.therapist_name}</span>
          {t.gender && (
            <span className="text-xs text-muted-foreground">{t.gender}</span>
          )}
          <span className="text-xs text-muted-foreground ml-auto shrink-0">
            {formatTime(t.start_time)}–{formatTime(t.end_time)}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium shrink-0',
              ATTENDANCE_STYLE[t.attendance_status],
            )}
          >
            {t.attendance_status}
          </span>
        </div>
      ))}
    </div>
  )
}
