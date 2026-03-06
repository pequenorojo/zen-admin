import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import {
  Armchair, BedDouble, MapPin, Layers, Clock, User, Stethoscope, UserCog, BarChart3,
} from 'lucide-react'
import type { LocationAvailability, LocationStats } from '@/types/location'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

function fmt(iso: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'HH:mm', { locale: zhTW })
}

interface Props {
  location: LocationAvailability
  stats?: LocationStats
}

export function LocationDetailPanel({ location: l, stats }: Props) {
  const busy = l.seat_occupied_now
  const Icon = l.type === 'bed' ? BedDouble : Armchair

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={cn(
          'flex h-14 w-14 items-center justify-center rounded-xl',
          busy ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600',
        )}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{l.label}</h2>
            <span className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              busy ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700',
            )}>
              {busy ? '使用中' : '空閒'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {l.type === 'chair' ? '腳位' : l.type === 'bed' ? '床位' : '其他'}
            {' · '}優先分數 {l.priority_score}
          </p>
        </div>
      </div>

      <Separator />

      {/* Location Info */}
      <div className="space-y-3">
        <p className="text-sm font-medium">位置資訊</p>
        <div className="grid grid-cols-2 gap-3">
          <DetailRow icon={<Layers className="h-4 w-4" />} label="樓層" value={`${l.floor}F`} />
          <DetailRow icon={<MapPin className="h-4 w-4" />} label="區域" value={l.zone ?? '—'} />
          {l.room && (
            <DetailRow icon={<MapPin className="h-4 w-4" />} label="房間" value={l.room} />
          )}
        </div>
      </div>

      {/* Current Usage */}
      {busy && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-sm font-medium">目前使用</p>
            <div className="grid grid-cols-2 gap-3">
              <DetailRow icon={<User className="h-4 w-4" />} label="客戶" value={l.customer_name ?? '—'} />
              <DetailRow icon={<Stethoscope className="h-4 w-4" />} label="服務" value={l.service_name ?? '—'} />
              <DetailRow icon={<UserCog className="h-4 w-4" />} label="師傅" value={l.therapist_name ?? '—'} />
              <DetailRow icon={<Clock className="h-4 w-4" />} label="時長" value={l.appt_duration_min ? `${l.appt_duration_min} 分鐘` : '—'} />
              {l.appt_scheduled_at && (
                <DetailRow icon={<Clock className="h-4 w-4" />} label="開始時間" value={fmt(l.appt_scheduled_at)} />
              )}
              {l.expected_available_at && (
                <DetailRow icon={<Clock className="h-4 w-4" />} label="預計空出" value={fmt(l.expected_available_at)} />
              )}
            </div>
          </div>
        </>
      )}

      {!busy && l.next_free_at && (
        <>
          <Separator />
          <div className="text-sm text-muted-foreground">
            下次可用：{fmt(l.next_free_at)}
          </div>
        </>
      )}

      {/* 30-Day Stats */}
      {stats && stats.session_count > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="h-4 w-4" />
              近 30 天統計
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="使用次數" value={`${stats.session_count} 次`} />
              <StatCard label="總時數" value={`${Math.round(stats.total_minutes / 60)} 小時`} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium">{value}</p>
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
