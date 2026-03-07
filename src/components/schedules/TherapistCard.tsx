import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X } from 'lucide-react'
import type { CurrentStatus } from '@/types/therapist'
import type { QueueTherapistCard } from '@/types/schedule'
import { cn } from '@/lib/utils'

const STATUS_BG: Record<CurrentStatus, string> = {
  WHITE:   'bg-white border-gray-200',
  YELLOW:  'bg-yellow-50 border-yellow-300',
  GREEN:   'bg-green-50 border-green-300',
  RED:     'bg-red-50 border-red-300',
  OFFLINE: 'bg-gray-100 border-gray-300 opacity-50',
}

const STATUS_CYCLE: CurrentStatus[] = ['WHITE', 'YELLOW', 'GREEN', 'RED', 'OFFLINE']

const GENDER_COLOR: Record<string, string> = {
  '男': 'text-blue-600',
  '女': 'text-pink-600',
}

interface Props {
  therapist: QueueTherapistCard
  index: number
  overlay?: boolean
  onRemove?: (id: string) => void
  onStatusChange?: (id: string, status: CurrentStatus) => void
}

export function TherapistCard({ therapist, index, overlay, onRemove, onStatusChange }: Props) {
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
    const i = STATUS_CYCLE.indexOf(therapist.current_status)
    const next = STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length]
    onStatusChange(therapist.therapist_id, next)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1 rounded-md border px-1.5 py-1 shadow-sm shrink-0 group',
        STATUS_BG[therapist.current_status],
        isDragging && 'opacity-40',
        overlay && 'shadow-lg ring-2 ring-primary/30',
      )}
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground text-[10px] leading-none"
        title="拖拉排序"
      >
        ⠿
      </span>
      <span
        onClick={cycleStatus}
        className={cn('font-bold text-xs cursor-pointer select-none', genderColor)}
        title="點擊切換狀態"
      >
        {therapist.employee_no ?? '—'}
      </span>
      {onRemove && (
        <button
          onClick={() => onRemove(therapist.therapist_id)}
          className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
          title="移除"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  )
}
