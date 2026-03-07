import { useDroppable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import type { QueueZone, QueueTherapistCard } from '@/types/schedule'
import { ZONE_LABELS } from '@/types/schedule'
import { TherapistCard } from './TherapistCard'
import { cn } from '@/lib/utils'

interface Props {
  zone: QueueZone
  therapistIds: string[]
  therapistMap: Map<string, QueueTherapistCard>
}

export function QueueColumn({ zone, therapistIds, therapistMap }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: zone })

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">{ZONE_LABELS[zone]}</h3>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {therapistIds.length}
        </span>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex items-center gap-2 overflow-x-auto rounded-lg border bg-muted/30 p-3 min-h-[52px] scrollbar-thin',
          isOver && 'ring-2 ring-primary/40 bg-primary/5',
        )}
      >
        <SortableContext items={therapistIds} strategy={horizontalListSortingStrategy}>
          {therapistIds.length === 0 ? (
            <p className="text-xs text-muted-foreground italic whitespace-nowrap">
              拖放師傅到此區
            </p>
          ) : (
            therapistIds.map((id, i) => {
              const t = therapistMap.get(id)
              return t ? <TherapistCard key={id} therapist={t} index={i} /> : null
            })
          )}
        </SortableContext>
      </div>
    </div>
  )
}
