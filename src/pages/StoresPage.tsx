import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { Phone, MapPin, Clock, Users as UsersIcon, CalendarCheck, DollarSign, AlertTriangle } from 'lucide-react'
import type { Store, StoreStats } from '@/types/store'
import { useStore } from '@/context/StoreContext'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

function fmt(iso: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'yyyy/MM/dd HH:mm', { locale: zhTW })
}

export function StoresPage() {
  const { current: store } = useStore()
  const [stats, setStats] = useState<StoreStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!store) return
    setLoading(true)
    apiFetch<StoreStats[]>('/api/stores/stats')
      .then((data) => {
        const match = data.find((s) => s.id === store.id)
        setStats(match ?? null)
      })
      .finally(() => setLoading(false))
  }, [store])

  if (!store) return null

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">店舖管理</h1>
        <p className="text-sm text-muted-foreground">
          {store.name} 的詳細資訊
        </p>
      </div>

      <StoreCard store={store} stats={stats ?? undefined} loading={loading} />
    </div>
  )
}

function StoreCard({ store, stats, loading }: { store: Store; stats?: StoreStats; loading: boolean }) {
  const isClosed = store.temp_closure_start && store.temp_closure_end
    && new Date() >= new Date(store.temp_closure_start)
    && new Date() <= new Date(store.temp_closure_end)

  return (
    <div className={cn(
      'rounded-xl border bg-card shadow-sm',
      isClosed && 'border-amber-300 bg-amber-50/50',
    )}>
      {/* header */}
      <div className="flex items-start justify-between px-5 pt-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{store.name}</h2>
            {isClosed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                <AlertTriangle className="h-3 w-3" />
                暫停營業
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">代碼：{store.code.slice(0, 8)}…</p>
        </div>
        <span className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          store.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
        )}>
          {store.is_active ? '營業中' : '已停用'}
        </span>
      </div>

      {/* info */}
      <div className="space-y-1.5 px-5 pt-3 text-sm">
        {store.address && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{store.address}</span>
          </div>
        )}
        {store.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            {store.phone}
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {store.timezone}
        </div>
      </div>

      {/* closure info */}
      {store.temp_closure_start && store.temp_closure_end && (
        <div className="mx-5 mt-3 rounded-md bg-amber-100/50 px-3 py-2 text-xs text-amber-800">
          暫停營業：{fmt(store.temp_closure_start)} — {fmt(store.temp_closure_end)}
        </div>
      )}

      {/* metadata */}
      <div className="flex gap-4 px-5 pt-3 text-xs text-muted-foreground">
        <span>黃燈閾值：{store.metadata.yellow_threshold_min ?? 130} min</span>
        <span>接客率：{((store.metadata.acceptance_rate ?? 0.8) * 100).toFixed(0)}%</span>
      </div>

      <Separator className="mt-4" />

      {/* stats */}
      <div className="grid grid-cols-3 divide-x px-0 py-3">
        <StatCell
          icon={<UsersIcon className="h-3.5 w-3.5" />}
          label="師傅"
          value={loading ? '…' : stats ? `${stats.available}/${stats.therapist_count}` : '—'}
          sub={stats?.in_service ? `${stats.in_service} 服務中` : undefined}
        />
        <StatCell
          icon={<CalendarCheck className="h-3.5 w-3.5" />}
          label="今日預約"
          value={loading ? '…' : stats ? `${stats.today_orders}` : '—'}
          sub={stats?.today_completed ? `${stats.today_completed} 已完成` : undefined}
        />
        <StatCell
          icon={<DollarSign className="h-3.5 w-3.5" />}
          label="今日營收"
          value={loading ? '…' : stats ? `$${Number(stats.today_revenue).toLocaleString()}` : '—'}
        />
      </div>
    </div>
  )
}

function StatCell({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-1">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-base font-bold tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  )
}
