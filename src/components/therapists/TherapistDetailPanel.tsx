import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { Phone, Award, Star, Zap, Calendar, Timer } from 'lucide-react'
import type { Therapist, TherapistAppointment, CurrentStatus } from '@/types/therapist'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { StatusLabel } from './StatusIndicator'
import { TierBadge } from './TierBadge'

function fmt(iso: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'MM/dd HH:mm', { locale: zhTW })
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'yyyy/MM/dd', { locale: zhTW })
}

const STATUS_OPTIONS: { value: CurrentStatus; label: string; dot: string }[] = [
  { value: 'WHITE',   label: '待班中', dot: 'bg-gray-400' },
  { value: 'YELLOW',  label: '等勞點', dot: 'bg-yellow-400' },
  { value: 'GREEN',   label: '休息中', dot: 'bg-green-500' },
  { value: 'RED',     label: '工作中', dot: 'bg-red-500' },
  { value: 'OFFLINE', label: '下線',   dot: 'bg-gray-300' },
]

interface Props {
  therapist: Therapist
  onStatusChanged?: () => void
}

export function TherapistDetailPanel({ therapist: t, onStatusChanged }: Props) {
  const [appointments, setAppointments] = useState<TherapistAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    setLoading(true)
    apiFetch<TherapistAppointment[]>(`/api/therapists/${t.id}/appointments?limit=20`)
      .then(setAppointments)
      .finally(() => setLoading(false))
  }, [t.id])

  const handleStatusChange = async (newStatus: CurrentStatus) => {
    if (newStatus === t.current_status || switching) return
    setSwitching(true)
    try {
      await apiFetch(`/api/therapists/${t.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_status: newStatus }),
      })
      onStatusChanged?.()
    } catch (e) {
      console.error('Failed to update status:', e)
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {t.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{t.name}</span>
              {t.gender && <span className="text-sm text-muted-foreground">{t.gender}</span>}
              <StatusLabel status={t.current_status} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {t.employee_no && <span>工號 {t.employee_no}</span>}
              <TierBadge tier={t.therapist_tier} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {t.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              {t.phone}
            </div>
          )}
          {t.hire_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              到職：{fmtDate(t.hire_date)}
            </div>
          )}
        </div>

        {t.bio && (
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm whitespace-pre-line">
            {t.bio}
          </div>
        )}
      </div>

      <Separator />

      {/* Status Switcher */}
      <div className="space-y-3">
        <p className="text-sm font-medium">切換狀態</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(({ value, label, dot }) => {
            const isActive = t.current_status === value
            return (
              <button
                key={value}
                type="button"
                disabled={switching || isActive}
                onClick={() => handleStatusChange(value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary bg-primary/10 text-primary cursor-default'
                    : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  switching && !isActive && 'opacity-50 cursor-not-allowed',
                )}
              >
                <span className={cn('h-2.5 w-2.5 rounded-full', dot)} />
                {label}
              </button>
            )
          })}
        </div>
        {t.status_updated_at && (
          <p className="text-xs text-muted-foreground">
            上次更新：{fmt(t.status_updated_at)}
          </p>
        )}
      </div>

      <Separator />

      {/* Stats */}
      <div className="space-y-3">
        <p className="text-sm font-medium">績效數據</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Zap className="h-3.5 w-3.5" />} label="積分" value={`${t.therapist_points}`} />
          <StatCard icon={<Star className="h-3.5 w-3.5" />} label="評分" value={`${t.rating}`} />
          <StatCard icon={<Award className="h-3.5 w-3.5" />} label="總服務次數" value={`${t.total_sessions}`} />
          <StatCard label="排位分數" value={`${t.rank_score.toFixed(2)}`} />
        </div>
      </div>

      <Separator />

      {/* Skills */}
      <div className="space-y-2">
        <p className="text-sm font-medium">技能</p>
        {t.skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">無技能紀錄</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {t.skills.map((s) => (
              <span key={s.id} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                {s.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Schedule & Buffer */}
      <div className="space-y-3">
        <p className="text-sm font-medium">班表與緩衝</p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="h-3.5 w-3.5 shrink-0" />
          緩衝時間：
          <span className="font-medium text-foreground">
            {t.personal_buffer_min != null ? `${t.personal_buffer_min} 分鐘` : '—'}
          </span>
        </div>

        {t.schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground">無排班紀錄</p>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
              const s = t.schedules.find((sc) => sc.day_of_week === dow)
              const isToday = new Date().getDay() === dow
              return (
                <div
                  key={dow}
                  className={`rounded-md border px-2 py-1.5 text-center text-xs ${
                    isToday ? 'border-primary bg-primary/5' : ''
                  } ${!s ? 'opacity-40' : ''}`}
                >
                  <p className={`font-medium ${isToday ? 'text-primary' : ''}`}>
                    {['日', '一', '二', '三', '四', '五', '六'][dow]}
                  </p>
                  {s ? (
                    <>
                      <p className="tabular-nums">{s.start_time.slice(0, 5)}</p>
                      <p className="tabular-nums">{s.end_time.slice(0, 5)}</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">休</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Appointments */}
      <div className="space-y-2">
        <p className="text-sm font-medium">近期預約（20 筆）</p>
        {loading ? (
          <p className="text-sm text-muted-foreground">載入中…</p>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">無預約紀錄</p>
        ) : (
          <div className="space-y-2">
            {appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{a.service_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmt(a.scheduled_at)} · {a.customer_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums">{a.duration_min}min</p>
                  <p className="text-xs text-muted-foreground">{a.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}
