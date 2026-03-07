import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { QueueTherapistCard } from '@/types/schedule'
import { StatusDot } from '@/components/therapists/StatusIndicator'
import { cn } from '@/lib/utils'

interface Props {
  therapist: QueueTherapistCard
  index: number
  overlay?: boolean
}

export function TherapistCard({ therapist, index, overlay }: Props) {
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
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-sm cursor-grab active:cursor-grabbing shrink-0',
        isDragging && 'opacity-40',
        overlay && 'shadow-lg ring-2 ring-primary/30',
      )}
    >
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
    </div>
  )
}
