import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { X, Phone, Award, Star, Zap, Calendar, Timer } from 'lucide-react'
import type { Therapist, TherapistAppointment } from '@/types/therapist'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { TierBadge } from './TierBadge'

function fmt(iso: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'MM/dd HH:mm', { locale: zhTW })
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'yyyy/MM/dd', { locale: zhTW })
}

interface Props {
  therapist: Therapist
  onClose: () => void
}

export function TherapistDetailDrawer({ therapist: t, onClose }: Props) {
  const [appointments, setAppointments] = useState<TherapistAppointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiFetch<TherapistAppointment[]>(`/api/therapists/${t.id}/appointments?limit=20`)
      .then(setAppointments)
      .finally(() => setLoading(false))
  }, [t.id])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 flex h-full w-[480px] flex-col overflow-y-auto bg-background shadow-xl">
        {/* header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">師傅詳情</h2>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-6 p-6">
          {/* basic info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {t.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">{t.name}</span>
                  {t.gender && <span className="text-sm text-muted-foreground">{t.gender}</span>}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {t.employee_no && <span>工號 {t.employee_no}</span>}
                  <TierBadge tier={t.therapist_tier} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-sm">
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

          {/* stats */}
          <div className="space-y-3">
            <p className="text-sm font-medium">績效數據</p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<Zap className="h-3.5 w-3.5" />} label="積分" value={`${t.therapist_points}`} />
              <StatCard icon={<Star className="h-3.5 w-3.5" />} label="評分" value={`${t.rating}`} />
              <StatCard icon={<Award className="h-3.5 w-3.5" />} label="總服務次數" value={`${t.total_sessions}`} />
            </div>
          </div>

          <Separator />

          {/* skills */}
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

          {/* schedule & buffer */}
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

          {/* appointments */}
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
