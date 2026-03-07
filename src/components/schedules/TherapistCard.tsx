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

const STATUS_OPTIONS: { value: CurrentStatus; label: string }[] = [
  { value: 'WHITE',   label: '待班' },
  { value: 'YELLOW',  label: '等勞點' },
  { value: 'GREEN',   label: '休息中' },
  { value: 'RED',     label: '工作中' },
  { value: 'OFFLINE', label: '離線' },
]

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-sm shadow-sm shrink-0 group',
        STATUS_BG[therapist.current_status],
        isDragging && 'opacity-40',
        overlay && 'shadow-lg ring-2 ring-primary/30',
      )}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground text-xs"
        title="拖拉排序"
      >
        ⠿
      </span>

      {/* Index */}
      <span className="text-[10px] text-muted-foreground font-mono w-4 text-right shrink-0">
        {index + 1}
      </span>

      {/* Employee number with gender color */}
      <span className={cn('font-bold text-xs shrink-0', genderColor)}>
        {therapist.employee_no ?? '—'}
      </span>

      {/* Status selector */}
      {onStatusChange && (
        <select
          value={therapist.current_status}
          onChange={(e) => onStatusChange(therapist.therapist_id, e.target.value as CurrentStatus)}
          className="h-5 rounded border-none bg-transparent px-0 text-[10px] cursor-pointer focus:ring-1 focus:ring-primary focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={() => onRemove(therapist.therapist_id)}
          className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
          title="移除"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
