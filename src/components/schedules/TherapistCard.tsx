import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, GripVertical } from 'lucide-react'
import { format } from 'date-fns'
import type { CurrentStatus } from '@/types/therapist'
import type { QueueTherapistCard, QueueZone } from '@/types/schedule'
import { ALL_ZONES, ZONE_LABELS } from '@/types/schedule'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const STATUS_BG: Record<CurrentStatus, string> = {
  WHITE:   'bg-white border-gray-200',
  YELLOW:  'bg-yellow-50 border-yellow-300',
  GREEN:   'bg-green-50 border-green-300',       // 休息中
  RED:     'bg-red-50 border-red-300',             // 工作中
  OFFLINE: 'bg-gray-100 border-gray-300 opacity-50',
}

// 4 working statuses only — OFFLINE is handled by dedicated X button
const STATUS_CYCLE: CurrentStatus[] = ['WHITE', 'YELLOW', 'GREEN', 'RED']

const STATUS_LABEL: Record<CurrentStatus, string> = {
  WHITE:   '待班',
  YELLOW:  '等勞點',
  GREEN:   '休息中',
  RED:     '工作中',
  OFFLINE: '離線',
}

const STATUS_DOT: Record<CurrentStatus, string> = {
  WHITE:   'bg-gray-300',
  YELLOW:  'bg-yellow-400',
  GREEN:   'bg-green-500',
  RED:     'bg-red-500',
  OFFLINE: 'bg-gray-400',
}

const GENDER_COLOR: Record<string, string> = {
  '男': 'text-blue-600',
  '女': 'text-pink-600',
}

interface Props {
  therapist: QueueTherapistCard
  index: number
  currentZone: QueueZone
  overlay?: boolean
  onRemove?: (id: string) => void
  onStatusChange?: (id: string, status: CurrentStatus) => void
  onZoneChange?: (id: string, from: QueueZone, to: QueueZone) => void
}

export function TherapistCard({ therapist, index, currentZone, overlay, onRemove, onStatusChange, onZoneChange }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: therapist.therapist_id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const genderColor = therapist.gender ? GENDER_COLOR[therapist.gender] ?? 'text-gray-600' : 'text-gray-600'

  const cycleStatus = () => {
    if (!onStatusChange) return
    const currentIdx = STATUS_CYCLE.indexOf(therapist.current_status)
    // If currently OFFLINE or not in cycle, start from WHITE
    const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % STATUS_CYCLE.length
    onStatusChange(therapist.therapist_id, STATUS_CYCLE[nextIdx])
  }

  const goOffline = () => {
    if (!onStatusChange) return
    onStatusChange(therapist.therapist_id, 'OFFLINE')
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex flex-col items-center rounded-lg border-2 shadow-sm shrink-0 w-20 group relative',
        STATUS_BG[therapist.current_status],
        isDragging && 'opacity-40',
        overlay && 'shadow-lg ring-2 ring-primary/30',
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="w-full flex justify-center py-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        title="拖拉排序"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Employee number + gender color */}
      <div className={cn('text-xl font-bold select-none leading-tight py-1', genderColor)}>
        {therapist.employee_no ?? '—'}
      </div>

      {/* Zone dropdown */}
      {onZoneChange && (
        <select
          value={currentZone}
          onChange={(e) => onZoneChange(therapist.therapist_id, currentZone, e.target.value as QueueZone)}
          className="w-16 h-5 rounded border-none bg-transparent text-[11px] text-muted-foreground cursor-pointer p-0 text-center focus:outline-none"
          title="切換列隊"
        >
          {ALL_ZONES.map((z) => (
            <option key={z} value={z}>{ZONE_LABELS[z]}</option>
          ))}
        </select>
      )}

      {/* Status toggle button */}
      <button
        onClick={cycleStatus}
        className="flex items-center gap-1 px-1.5 py-1 rounded text-[11px] leading-none text-muted-foreground hover:bg-black/5 transition-colors"
        title="切換狀態"
      >
        <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', STATUS_DOT[therapist.current_status])} />
        <span className="truncate">{STATUS_LABEL[therapist.current_status]}</span>
      </button>

      {/* Active appointment short code (RED status) */}
      {therapist.current_status === 'RED' && therapist.current_appointment_id && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="px-1.5 py-0.5 rounded bg-red-200 text-red-800 text-[10px] font-mono font-bold hover:bg-red-300 transition-colors"
              title="查看訂單"
              onClick={(e) => e.stopPropagation()}
            >
              #{therapist.current_appointment_id.slice(0, 4)}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3 text-xs" side="right" align="start">
            <div className="space-y-1.5">
              <p className="font-semibold text-sm">訂單摘要</p>
              <p><span className="text-muted-foreground">客戶：</span>{therapist.current_customer_name ?? '—'}</p>
              <p><span className="text-muted-foreground">服務：</span>{therapist.current_service_name ?? '—'}</p>
              {therapist.current_scheduled_at && (
                <p><span className="text-muted-foreground">時間：</span>{format(new Date(therapist.current_scheduled_at), 'HH:mm')}</p>
              )}
              {therapist.current_duration_min != null && (
                <p><span className="text-muted-foreground">時長：</span>{therapist.current_duration_min} 分鐘</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Offline / remove button */}
      {onRemove && (
        <button
          onClick={goOffline}
          className="w-full flex justify-center py-1 rounded-b-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          title="離線"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
