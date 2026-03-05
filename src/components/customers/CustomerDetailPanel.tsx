import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { Phone, Mail, Calendar, TrendingUp, ShieldAlert } from 'lucide-react'
import type { Customer, CustomerStats, CustomerAppointment } from '@/types/customer'
import { apiFetch } from '@/lib/api'
import { Separator } from '@/components/ui/separator'
import { MembershipBadge } from './MembershipBadge'

function fmt(iso: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'yyyy/MM/dd HH:mm', { locale: zhTW })
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'yyyy/MM/dd', { locale: zhTW })
}

interface Props {
  customer: Customer
}

export function CustomerDetailPanel({ customer }: Props) {
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch<CustomerStats>(`/api/customers/${customer.id}/stats`),
      apiFetch<CustomerAppointment[]>(`/api/customers/${customer.id}/appointments`),
    ]).then(([s, a]) => {
      setStats(s)
      setAppointments(a)
    }).finally(() => setLoading(false))
  }, [customer.id])

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {customer.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{customer.name}</span>
              {customer.gender && <span className="text-sm text-muted-foreground">{customer.gender}</span>}
              <MembershipBadge level={customer.membership_level} />
            </div>
            {customer.is_blacklisted && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <ShieldAlert className="h-3 w-3" />
                黑名單{customer.blacklist_scope ? `（${customer.blacklist_scope}）` : ''}
                {customer.blacklist_target_name && ` — ${customer.blacklist_target_name}`}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            {customer.phone}
          </div>
          {customer.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {customer.email}
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            註冊：{fmtDate(customer.created_at)}
          </div>
          {customer.referrer_name && (
            <div className="text-muted-foreground">
              推薦人：{customer.referrer_name}
            </div>
          )}
        </div>

        {customer.notes && (
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm whitespace-pre-line">
            {customer.notes}
          </div>
        )}
      </div>

      <Separator />

      {/* Stats */}
      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : stats ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            消費統計
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="完成預約" value={`${stats.completed_count} 次`} />
            <StatCard label="累計消費" value={`$${stats.total_spend.toLocaleString()}`} />
            <StatCard label="平均消費" value={`$${stats.avg_spend.toLocaleString()}`} />
            <StatCard label="近 30 天" value={`$${stats.spend_30d.toLocaleString()}`} />
            <StatCard label="積分餘額" value={`${customer.points_balance}`} />
            <StatCard label="最後造訪" value={fmtDate(stats.last_visit_at)} />
          </div>

          {stats.top_services.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">常用服務</p>
              <div className="flex flex-wrap gap-1.5">
                {stats.top_services.map((s) => (
                  <span key={s.service_name} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    {s.service_name} x{s.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      <Separator />

      {/* Appointment History */}
      <div className="space-y-2">
        <p className="text-sm font-medium">預約紀錄（近 30 筆）</p>
        {loading ? (
          <p className="text-sm text-muted-foreground">載入中…</p>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">無預約紀錄</p>
        ) : (
          <div className="space-y-2">
            {appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{a.service_name ?? '未知服務'}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmt(a.scheduled_at)} · {a.therapist_name ?? '未指派'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums">{a.service_price != null ? `$${a.service_price}` : ''}</p>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}
