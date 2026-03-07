import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, GripVertical } from 'lucide-react'
import type { CurrentStatus } from '@/types/therapist'
import type { QueueTherapistCard, QueueZone } from '@/types/schedule'
import { ALL_ZONES, ZONE_LABELS } from '@/types/schedule'
import { cn } from '@/lib/utils'

const STATUS_BG: Record<CurrentStatus, string> = {
  WHITE:   'bg-white border-gray-200',
  YELLOW:  'bg-yellow-50 border-yellow-300',
  GREEN:   'bg-green-50 border-green-300',
  RED:     'bg-red-50 border-red-300',
  OFFLINE: 'bg-gray-100 border-gray-300 opacity-50',
}

// 4 working statuses only — OFFLINE is handled by dedicated X button
const STATUS_CYCLE: CurrentStatus[] = ['WHITE', 'YELLOW', 'GREEN', 'RED']

const STATUS_LABEL: Record<CurrentStatus, string> = {
  WHITE:   '待班',
  YELLOW:  '等勞點',
  GREEN:   '工作中',
  RED:     '休息中',
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
        'flex flex-col items-center rounded-lg border shadow-sm shrink-0 w-14 group relative',
        STATUS_BG[therapist.current_status],
        isDragging && 'opacity-40',
        overlay && 'shadow-lg ring-2 ring-primary/30',
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="w-full flex justify-center py-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        title="拖拉排序"
      >
        <GripVertical className="h-3 w-3" />
      </div>

      {/* Employee number + gender color */}
      <div className={cn('text-sm font-bold select-none leading-tight', genderColor)}>
        {therapist.employee_no ?? '—'}
      </div>

      {/* Zone dropdown */}
      {onZoneChange && (
        <select
          value={currentZone}
          onChange={(e) => onZoneChange(therapist.therapist_id, currentZone, e.target.value as QueueZone)}
          className="w-11 h-4 rounded border-none bg-transparent text-[8px] text-muted-foreground cursor-pointer p-0 text-center focus:outline-none"
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
        className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] leading-none text-muted-foreground hover:bg-black/5 transition-colors"
        title="切換狀態"
      >
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', STATUS_DOT[therapist.current_status])} />
        <span className="truncate">{STATUS_LABEL[therapist.current_status]}</span>
      </button>

      {/* Offline / remove button */}
      {onRemove && (
        <button
          onClick={goOffline}
          className="w-full flex justify-center py-0.5 rounded-b-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          title="離線"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
