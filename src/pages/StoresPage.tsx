import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import {
  Phone, MapPin, Clock, Users as UsersIcon, CalendarCheck,
  DollarSign, AlertTriangle, Store as StoreIcon, Settings2,
} from 'lucide-react'
import type { Store, StoreStats } from '@/types/store'
import { useStore } from '@/context/StoreContext'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

function fmt(iso: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'yyyy/MM/dd HH:mm', { locale: zhTW })
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'yyyy/MM/dd', { locale: zhTW })
}

export function StoresPage() {
  const { stores, current, setCurrent } = useStore()
  const [statsMap, setStatsMap] = useState<Map<string, StoreStats>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiFetch<StoreStats[]>('/api/stores/stats')
      .then((data) => {
        const m = new Map<string, StoreStats>()
        data.forEach((s) => m.set(s.id, s))
        setStatsMap(m)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">店舖管理</h1>
        <p className="text-sm text-muted-foreground">
          共 {stores.length} 間店舖
        </p>
      </div>

      {/* Master-Detail */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Store List */}
        <div className="w-[360px] shrink-0 overflow-y-auto border-r">
          <div className="divide-y">
            {stores.map((s) => {
              const isClosed = s.temp_closure_start && s.temp_closure_end
                && new Date() >= new Date(s.temp_closure_start)
                && new Date() <= new Date(s.temp_closure_end)
              return (
                <div
                  key={s.id}
                  onClick={() => setCurrent(s)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50',
                    current?.id === s.id && 'bg-accent',
                  )}
                >
                  <div className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    s.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                  )}>
                    <StoreIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{s.name}</span>
                      {isClosed && (
                        <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.address ?? s.timezone}
                    </p>
                  </div>
                  <span className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                    s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                  )}>
                    {s.is_active ? '營業中' : '停用'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Detail */}
        <div className="flex-1 overflow-y-auto">
          {current ? (
            <div className="p-6">
              <StoreDetailPanel store={current} stats={statsMap.get(current.id)} loading={loading} />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>選擇一間店舖以查看詳情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StoreDetailPanel({ store, stats, loading }: { store: Store; stats?: StoreStats; loading: boolean }) {
  const isClosed = store.temp_closure_start && store.temp_closure_end
    && new Date() >= new Date(store.temp_closure_start)
    && new Date() <= new Date(store.temp_closure_end)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <StoreIcon className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{store.name}</h2>
            <span className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              store.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
            )}>
              {store.is_active ? '營業中' : '已停用'}
            </span>
            {isClosed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                <AlertTriangle className="h-3 w-3" />
                暫停營業
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">代碼：{store.code.slice(0, 8)}…</p>
        </div>
      </div>

      <Separator />

      {/* Contact & Location */}
      <div className="space-y-3">
        <p className="text-sm font-medium">聯絡與地址</p>
        <div className="grid grid-cols-2 gap-3">
          {store.address && (
            <DetailRow icon={<MapPin className="h-4 w-4" />} label="地址" value={store.address} />
          )}
          {store.phone && (
            <DetailRow icon={<Phone className="h-4 w-4" />} label="電話" value={store.phone} />
          )}
          <DetailRow icon={<Clock className="h-4 w-4" />} label="時區" value={store.timezone} />
        </div>
      </div>

      {/* Closure Info */}
      {store.temp_closure_start && store.temp_closure_end && (
        <>
          <Separator />
          <div className="rounded-md bg-amber-100/50 px-4 py-3 text-sm text-amber-800">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              暫停營業期間
            </div>
            <p className="mt-1 text-xs">
              {fmt(store.temp_closure_start)} — {fmt(store.temp_closure_end)}
            </p>
          </div>
        </>
      )}

      <Separator />

      {/* KPIs */}
      <div className="space-y-3">
        <p className="text-sm font-medium">今日營運</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<UsersIcon className="h-3.5 w-3.5" />}
            label="師傅"
            value={loading ? '…' : stats ? `${stats.available}/${stats.therapist_count}` : '—'}
            sub={stats?.in_service ? `${stats.in_service} 服務中` : undefined}
          />
          <StatCard
            icon={<CalendarCheck className="h-3.5 w-3.5" />}
            label="今日預約"
            value={loading ? '…' : stats ? `${stats.today_orders}` : '—'}
            sub={stats?.today_completed ? `${stats.today_completed} 已完成` : undefined}
          />
          <StatCard
            icon={<DollarSign className="h-3.5 w-3.5" />}
            label="今日營收"
            value={loading ? '…' : stats ? `$${Number(stats.today_revenue).toLocaleString()}` : '—'}
          />
        </div>
      </div>

      <Separator />

      {/* Metadata */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Settings2 className="h-4 w-4" />
          系統參數
        </div>
        <div className="grid grid-cols-2 gap-3">
          <DetailRow label="黃燈閾值" value={`${store.metadata.yellow_threshold_min ?? 130} 分鐘`} />
          <DetailRow label="接客率" value={`${((store.metadata.acceptance_rate ?? 0.8) * 100).toFixed(0)}%`} />
          <DetailRow label="建立時間" value={fmtDate(store.created_at)} />
        </div>
      </div>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
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

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-base font-bold tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  )
}
