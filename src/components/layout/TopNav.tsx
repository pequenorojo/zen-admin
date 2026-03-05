import { NavLink } from 'react-router-dom'
import { CalendarCheck, Users, UserCog, ClipboardList, MapPin, Store, BarChart3, Settings, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
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

export function TopNav() {
  const { stores, current, setCurrent } = useStore()

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-border bg-background px-4 gap-4">
      {/* Brand */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          禪
        </div>
        <span className="text-sm font-semibold hidden sm:inline">禪預約系統</span>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-0.5 overflow-x-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Store Selector */}
      {stores.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex shrink-0 items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-accent">
            <span className="max-w-[140px] truncate font-medium">{current?.name ?? '選擇店舖'}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[240px]">
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
      )}
    </header>
  )
}
