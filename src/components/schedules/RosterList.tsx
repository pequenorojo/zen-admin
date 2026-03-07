import type { RosterTherapist, AttendanceDisplayStatus, QueueZone } from '@/types/schedule'
import { ALL_ZONES, ZONE_LABELS } from '@/types/schedule'
import { StatusDot } from '@/components/therapists/StatusIndicator'
import { cn } from '@/lib/utils'

const ATTENDANCE_STYLE: Record<AttendanceDisplayStatus, string> = {
  '已出勤':   'bg-green-100 text-green-700',
  '尚未出勤': 'bg-gray-100 text-gray-500',
  '下線':     'bg-orange-100 text-orange-700',
}

const ZONE_COLORS: Record<QueueZone, string> = {
  long: 'bg-blue-100 text-blue-700',
  short: 'bg-purple-100 text-purple-700',
  support: 'bg-amber-100 text-amber-700',
  nail: 'bg-pink-100 text-pink-700',
}

interface Props {
  therapists: RosterTherapist[]
  loading: boolean
  assignments: Map<string, QueueZone>
  onAssign: (therapistId: string, zone: QueueZone | null) => void
}

export function RosterList({ therapists, loading, assignments, onAssign }: Props) {
  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">載入中…</div>
  }

  if (therapists.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">無在職師傅</div>
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-1 pr-1">
      {therapists.map((t) => {
        const currentZone = assignments.get(t.therapist_id)
        return (
          <div
            key={t.therapist_id}
            className="flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-sm"
          >
            <StatusDot status={t.current_status} />
            <span className="text-muted-foreground text-xs w-8 shrink-0">
              {t.employee_no ?? '—'}
            </span>
            <span className="font-medium truncate text-xs">{t.therapist_name}</span>
            {t.gender && (
              <span className="text-[10px] text-muted-foreground">{t.gender}</span>
            )}
            <div className="ml-auto shrink-0 flex items-center gap-1">
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                  ATTENDANCE_STYLE[t.attendance_status],
                )}
              >
                {t.attendance_status}
              </span>
              <select
                value={currentZone ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  onAssign(t.therapist_id, val ? (val as QueueZone) : null)
                }}
                className="h-6 rounded border bg-white px-1 text-[10px] cursor-pointer focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="">—</option>
                {ALL_ZONES.map((z) => (
                  <option key={z} value={z}>{ZONE_LABELS[z]}</option>
                ))}
              </select>
            </div>
          </div>
        )
      })}
    </div>
  )
}
