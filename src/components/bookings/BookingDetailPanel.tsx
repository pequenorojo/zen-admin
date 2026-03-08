import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import {
  Calendar, Clock, User, Phone, UserCog, Stethoscope,
  DollarSign, FileText, Hash, Tag, Loader2, AlertTriangle,
} from 'lucide-react'
import type { Booking, BookingStatus } from '@/types/booking'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from './StatusBadge'
import { CheckinForm } from './CheckinForm'

function fmt(iso: string) {
  return format(new Date(iso), 'yyyy/MM/dd (EEEE) HH:mm', { locale: zhTW })
}

function fmtShort(iso: string) {
  return format(new Date(iso), 'yyyy/MM/dd HH:mm', { locale: zhTW })
}

interface StatusAction {
  label: string
  targetStatus: BookingStatus
  variant: 'default' | 'destructive' | 'outline' | 'secondary'
  confirmMessage: string
}

const CHECKIN_ACTIONS: StatusAction[] = [
  { label: '報到', targetStatus: 'checked_in', variant: 'default', confirmMessage: '確認客戶報到？將自動派工並鎖定位置。' },
  { label: '未到', targetStatus: 'no_show', variant: 'secondary', confirmMessage: '確認標記為未到？' },
  { label: '取消預約', targetStatus: 'cancelled', variant: 'destructive', confirmMessage: '確認取消此預約？' },
]

const SERVICE_ACTIONS: StatusAction[] = [
  { label: '完成服務', targetStatus: 'completed', variant: 'default', confirmMessage: '確認服務已完成？將釋放位置並結算積分。' },
  { label: '取消預約', targetStatus: 'cancelled', variant: 'destructive', confirmMessage: '確認取消此預約？將釋放師傅和位置。' },
]

function getActions(status: BookingStatus): StatusAction[] {
  if (status === 'pending' || status === 'confirmed') return CHECKIN_ACTIONS
  if (status === 'checked_in' || status === 'in_progress') return SERVICE_ACTIONS
  return []
}

interface Props {
  booking: Booking
  storeId: string
  onStatusChanged?: () => void
}

export function BookingDetailPanel({ booking: b, storeId, onStatusChanged }: Props) {
  const [confirming, setConfirming] = useState<BookingStatus | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const actions = getActions(b.status)

  const handleAction = async (targetStatus: BookingStatus, overrides?: { therapist_id?: string; location_id?: string }) => {
    setSubmitting(true)
    setActionError(null)
    try {
      await apiFetch(`/api/appointments/${b.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus, ...overrides }),
      })
      setConfirming(null)
      onStatusChanged?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : '操作失敗'
      setActionError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{b.customer_name}</h2>
          <StatusBadge status={b.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          預約編號：{b.id.slice(0, 8)}…
        </p>
      </div>

      <Separator />

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <DetailRow icon={<Calendar className="h-4 w-4" />} label="預約時間" value={fmt(b.scheduled_at)} />
        <DetailRow icon={<Clock className="h-4 w-4" />} label="服務時長" value={`${b.duration_min} 分鐘`} />
        <DetailRow icon={<Stethoscope className="h-4 w-4" />} label="服務項目" value={b.service_name} />
        <DetailRow icon={<DollarSign className="h-4 w-4" />} label="服務價格" value={`$${b.service_price}`} />
        <DetailRow icon={<User className="h-4 w-4" />} label="客戶姓名" value={b.customer_name} />
        <DetailRow icon={<Phone className="h-4 w-4" />} label="客戶電話" value={b.customer_phone} />
        <DetailRow
          icon={<UserCog className="h-4 w-4" />}
          label="指派師傅"
          value={b.therapist_name ?? '未指派'}
          sub={b.therapist_preference !== '指定' ? b.therapist_preference : undefined}
        />
        <DetailRow icon={<Hash className="h-4 w-4" />} label="人數序號" value={`第 ${b.person_index + 1} 位`} />
      </div>

      {/* Time Tracking Timeline */}
      {b.actual_check_in_time && b.scheduled_start_time && b.estimated_end_time && (
        <>
          <Separator />
          <ServiceTimeline
            actualCheckIn={b.actual_check_in_time}
            scheduledStart={b.scheduled_start_time}
            estimatedEnd={b.estimated_end_time}
            status={b.status}
          />
        </>
      )}

      {b.notes && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              備註
            </div>
            <p className="rounded-md bg-muted/50 px-3 py-2 text-sm whitespace-pre-line">{b.notes}</p>
          </div>
        </>
      )}

      {b.booking_group_id && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Tag className="h-4 w-4" />
              群組預約
            </div>
            <p className="text-sm text-muted-foreground">
              群組編號：{b.booking_group_id.slice(0, 8)}…
            </p>
          </div>
        </>
      )}

      <Separator />

      {/* Timestamps */}
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>建立時間：{fmtShort(b.created_at)}</p>
        <p>更新時間：{fmtShort(b.updated_at)}</p>
        {b.wolfram_score != null && (
          <p>Wolfram 分數：{b.wolfram_score}</p>
        )}
      </div>

      {/* Action Buttons */}
      {actions.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            {/* Error message */}
            {actionError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {actionError}
              </div>
            )}

            {/* Confirmation prompt */}
            {confirming === 'checked_in' ? (
              <CheckinForm
                booking={b}
                storeId={storeId}
                onSubmit={(overrides) => handleAction('checked_in', overrides)}
                onCancel={() => { setConfirming(null); setActionError(null) }}
                submitting={submitting}
                error={actionError}
              />
            ) : confirming ? (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <p className="text-sm font-medium">
                  {actions.find((a) => a.targetStatus === confirming)?.confirmMessage}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={actions.find((a) => a.targetStatus === confirming)?.variant ?? 'default'}
                    disabled={submitting}
                    onClick={() => handleAction(confirming)}
                  >
                    {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                    確認
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={submitting}
                    onClick={() => { setConfirming(null); setActionError(null) }}
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <Button
                    key={action.targetStatus}
                    size="sm"
                    variant={action.variant}
                    onClick={() => { setConfirming(action.targetStatus); setActionError(null) }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function DetailRow({ icon, label, value, sub }: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ── 服務時間軸 ──────────────────────────────────────────────────────────────
function fmtTime(iso: string) {
  return format(new Date(iso), 'HH:mm')
}

function ServiceTimeline({ actualCheckIn, scheduledStart, estimatedEnd, status }: {
  actualCheckIn: string
  scheduledStart: string
  estimatedEnd: string
  status: BookingStatus
}) {
  const [now, setNow] = useState(Date.now())

  // Live tick every 30s for overtime detection (only for active statuses)
  const isActive = status === 'checked_in' || status === 'in_progress'
  useEffect(() => {
    if (!isActive) return
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [isActive])

  const checkInTs = new Date(actualCheckIn).getTime()
  const startTs = new Date(scheduledStart).getTime()
  const endTs = new Date(estimatedEnd).getTime()

  const isLate = checkInTs > startTs + 60_000 // 1 min tolerance
  const isEarly = checkInTs < startTs - 60_000
  const overtimeMin = isActive ? Math.max(0, Math.round((now - endTs) / 60_000)) : 0
  const isOvertime = overtimeMin > 0
  const isSevereOvertime = overtimeMin > 15

  // Remaining service duration if late
  const fullDuration = Math.round((endTs - startTs) / 60_000)
  const effectiveDuration = isLate
    ? Math.max(0, Math.round((endTs - checkInTs) / 60_000))
    : fullDuration

  // Progress bar (0-100) for active statuses
  const totalSpan = endTs - startTs
  const elapsed = now - startTs
  const progress = isActive ? Math.min(100, Math.max(0, Math.round((elapsed / totalSpan) * 100))) : (status === 'completed' ? 100 : 0)

  const progressColor = isSevereOvertime
    ? 'bg-red-500'
    : isOvertime
      ? 'bg-orange-500'
      : 'bg-emerald-500'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className="h-4 w-4" />
        服務時間軸
      </div>

      {/* Timeline bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{fmtTime(scheduledStart)}</span>
          <span>{fmtTime(estimatedEnd)}</span>
        </div>
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all ${progressColor}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
          {/* Check-in marker */}
          {isLate && (
            <div
              className="absolute top-0 h-full w-0.5 bg-amber-500"
              style={{ left: `${Math.min(100, Math.max(0, ((checkInTs - startTs) / totalSpan) * 100))}%` }}
              title={`報到 ${fmtTime(actualCheckIn)}`}
            />
          )}
        </div>
      </div>

      {/* 3 time points */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground">報到時間</p>
          <p className={`text-xs font-medium ${isLate ? 'text-amber-600' : ''}`}>
            {fmtTime(actualCheckIn)}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground">排定開始</p>
          <p className="text-xs font-medium">{fmtTime(scheduledStart)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground">預計結束</p>
          <p className={`text-xs font-medium ${isOvertime ? (isSevereOvertime ? 'text-red-600' : 'text-orange-600') : ''}`}>
            {fmtTime(estimatedEnd)}
          </p>
        </div>
      </div>

      {/* Status tags */}
      <div className="flex flex-wrap gap-1.5">
        {isEarly && (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
            早到 {Math.round((startTs - checkInTs) / 60_000)} 分鐘
          </span>
        )}
        {isLate && (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            遲到 {Math.round((checkInTs - startTs) / 60_000)} 分鐘
          </span>
        )}
        {isLate && effectiveDuration < fullDuration && (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            可用時長 {effectiveDuration}/{fullDuration} 分鐘
          </span>
        )}
        {isOvertime && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            isSevereOvertime ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
          }`}>
            <AlertTriangle className="h-3 w-3" />
            超時 {overtimeMin} 分鐘
          </span>
        )}
      </div>
    </div>
  )
}
