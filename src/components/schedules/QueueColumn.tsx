import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import type { CurrentStatus } from '@/types/therapist'
import type { QueueZone, QueueTherapistCard } from '@/types/schedule'
import { ZONE_LABELS } from '@/types/schedule'
import { TherapistCard } from './TherapistCard'

interface Props {
  zone: QueueZone
  therapistIds: string[]
  therapistMap: Map<string, QueueTherapistCard>
  onRemove: (therapistId: string) => void
  onStatusChange: (therapistId: string, status: CurrentStatus) => void
  onZoneChange: (therapistId: string, from: QueueZone, to: QueueZone) => void
}

export function QueueColumn({ zone, therapistIds, therapistMap, onRemove, onStatusChange, onZoneChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">{ZONE_LABELS[zone]}</h3>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {therapistIds.length}
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto rounded-lg border bg-muted/30 p-3 min-h-[48px] scrollbar-thin">
        <SortableContext items={therapistIds} strategy={horizontalListSortingStrategy}>
          {therapistIds.length === 0 ? (
            <p className="text-xs text-muted-foreground italic whitespace-nowrap">
              從左側名單分配師傅到此區
            </p>
          ) : (
            therapistIds.map((id, i) => {
              const t = therapistMap.get(id)
              return t ? (
                <TherapistCard
                  key={id}
                  therapist={t}
                  index={i}
                  currentZone={zone}
                  onRemove={onRemove}
                  onStatusChange={onStatusChange}
                  onZoneChange={onZoneChange}
                />
              ) : null
            })
          )}
        </SortableContext>
      </div>
    </div>
  )
}
