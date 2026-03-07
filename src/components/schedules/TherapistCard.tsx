import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X } from 'lucide-react'
import type { QueueTherapistCard } from '@/types/schedule'
import { StatusDot } from '@/components/therapists/StatusIndicator'
import { cn } from '@/lib/utils'

interface Props {
  therapist: QueueTherapistCard
  index: number
  overlay?: boolean
  onRemove?: (id: string) => void
}

export function TherapistCard({ therapist, index, overlay, onRemove }: Props) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-sm shrink-0 group',
        isDragging && 'opacity-40',
        overlay && 'shadow-lg ring-2 ring-primary/30',
      )}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        title="拖拉排序"
      >
        ⠿
      </span>
      <span className="text-xs text-muted-foreground font-mono w-5 text-right shrink-0">
        {index + 1}
      </span>
      <StatusDot status={therapist.current_status} />
      <span className="font-medium whitespace-nowrap">{therapist.therapist_name}</span>
      {therapist.gender && (
        <span className="text-xs text-muted-foreground">{therapist.gender}</span>
      )}
      {therapist.employee_no && (
        <span className="text-xs text-muted-foreground">#{therapist.employee_no}</span>
      )}
      {onRemove && (
        <button
          onClick={() => onRemove(therapist.therapist_id)}
          className="ml-1 rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
          title="移除"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
