import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import {
  Calendar, Clock, User, Phone, UserCog, Stethoscope,
  DollarSign, FileText, Hash, Tag,
} from 'lucide-react'
import type { Booking } from '@/types/booking'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from './StatusBadge'

function fmt(iso: string) {
  return format(new Date(iso), 'yyyy/MM/dd (EEEE) HH:mm', { locale: zhTW })
}

function fmtShort(iso: string) {
  return format(new Date(iso), 'yyyy/MM/dd HH:mm', { locale: zhTW })
}

interface Props {
  booking: Booking
}

export function BookingDetailPanel({ booking: b }: Props) {
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
