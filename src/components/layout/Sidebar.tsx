import { NavLink } from 'react-router-dom'
import { CalendarCheck, Users, UserCog, ClipboardList, MapPin, Store, BarChart3, Settings, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { useStore } from '@/context/StoreContext'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const NAV_ITEMS = [
  { to: '/bookings',   label: '預約管理', icon: CalendarCheck },
  { to: '/customers',  label: '客戶管理', icon: Users },
  { to: '/therapists', label: '師傅管理', icon: UserCog },
  { to: '/locations',  label: '位置管理', icon: MapPin },
  { to: '/stores',     label: '店舖管理', icon: Store },
  { to: '/schedules',  label: '排班管理', icon: ClipboardList },
  { to: '/reports',    label: '數據報表', icon: BarChart3 },
  { to: '/settings',   label: '系統設定', icon: Settings },
]

export function Sidebar() {
  const { stores, current, setCurrent } = useStore()

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
          禪
        </div>
        <div>
          <p className="text-sm font-semibold text-sidebar-foreground">禪預約系統</p>
          <p className="text-xs text-muted-foreground">管理後台</p>
        </div>
      </div>

      <Separator />

      {/* Store Selector */}
      {stores.length > 0 && (
        <div className="px-3 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:bg-accent">
              <span className="truncate font-medium">{current?.name ?? '選擇店舖'}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[232px]">
              {stores.map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => setCurrent(s)}
                  className={cn(current?.id === s.id && 'bg-accent')}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.address}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-6 py-4">
        <p className="text-xs text-muted-foreground">Zen Admin v1.0.0</p>
      </div>
    </aside>
  )
}
