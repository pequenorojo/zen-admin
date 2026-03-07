import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import type { QueueZone, QueueTherapistCard, QueuePosition } from '@/types/schedule'
import { ALL_ZONES } from '@/types/schedule'
import { QueueColumn } from './QueueColumn'
import { TherapistCard } from './TherapistCard'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'

type Positions = Record<QueueZone, string[]>

interface Props {
  positions: Positions
  unassigned: string[]
  therapistMap: Map<string, QueueTherapistCard>
  storeId: string
  onPositionsChange: (p: Positions, u: string[]) => void
}

const UNASSIGNED_ID = '__unassigned__'

function UnassignedPool({
  ids,
  therapistMap,
}: {
  ids: string[]
  therapistMap: Map<string, QueueTherapistCard>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: UNASSIGNED_ID })

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">未分配師傅</h3>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {ids.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex items-center gap-2 flex-wrap rounded-lg border border-dashed bg-muted/20 p-3 min-h-[52px]',
          isOver && 'ring-2 ring-primary/40 bg-primary/5',
        )}
      >
        <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
          {ids.length === 0 ? (
            <p className="text-xs text-muted-foreground italic whitespace-nowrap">
              所有已出勤師傅皆已分配
            </p>
          ) : (
            ids.map((id, i) => {
              const t = therapistMap.get(id)
              return t ? <TherapistCard key={id} therapist={t} index={i} /> : null
            })
          )}
        </SortableContext>
      </div>
    </div>
  )
}

export function QueueBoard({ positions, unassigned, therapistMap, storeId, onPositionsChange }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const findContainer = useCallback(
    (id: string): QueueZone | typeof UNASSIGNED_ID | null => {
      if (unassigned.includes(id)) return UNASSIGNED_ID
      for (const zone of ALL_ZONES) {
        if (positions[zone].includes(id)) return zone
      }
      // Check if id is a container itself
      if (id === UNASSIGNED_ID) return UNASSIGNED_ID
      if (ALL_ZONES.includes(id as QueueZone)) return id as QueueZone
      return null
    },
    [positions, unassigned],
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeContainer = findContainer(active.id as string)
    let overContainer = findContainer(over.id as string)

    // If over is a zone or UNASSIGNED_ID, treat as that container
    if (over.id === UNASSIGNED_ID || ALL_ZONES.includes(over.id as QueueZone)) {
      overContainer = over.id as QueueZone | typeof UNASSIGNED_ID
    }

    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    const newPositions = { ...positions, long: [...positions.long], short: [...positions.short], support: [...positions.support], nail: [...positions.nail] }
    let newUnassigned = [...unassigned]

    // Remove from source
    if (activeContainer === UNASSIGNED_ID) {
      newUnassigned = newUnassigned.filter((id) => id !== active.id)
    } else {
      newPositions[activeContainer] = newPositions[activeContainer].filter((id) => id !== active.id)
    }

    // Add to target
    if (overContainer === UNASSIGNED_ID) {
      newUnassigned.push(active.id as string)
    } else {
      const overIndex = newPositions[overContainer].indexOf(over.id as string)
      if (overIndex >= 0) {
        newPositions[overContainer].splice(overIndex, 0, active.id as string)
      } else {
        newPositions[overContainer].push(active.id as string)
      }
    }

    onPositionsChange(newPositions, newUnassigned)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeContainer = findContainer(active.id as string)
    let overContainer = findContainer(over.id as string)

    if (over.id === UNASSIGNED_ID || ALL_ZONES.includes(over.id as QueueZone)) {
      overContainer = over.id as QueueZone | typeof UNASSIGNED_ID
    }

    if (!activeContainer || !overContainer) return

    // Same container — reorder
    if (activeContainer === overContainer && activeContainer !== UNASSIGNED_ID) {
      const zone = activeContainer as QueueZone
      const items = [...positions[zone]]
      const oldIndex = items.indexOf(active.id as string)
      const newIndex = items.indexOf(over.id as string)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(items, oldIndex, newIndex)
        const newPositions = { ...positions, [zone]: reordered }
        onPositionsChange(newPositions, unassigned)
      }
    }

    // Save to backend
    await savePositions()
  }

  const savePositions = async () => {
    setSaving(true)
    try {
      const payload: QueuePosition[] = []
      for (const zone of ALL_ZONES) {
        positions[zone].forEach((id, i) => {
          payload.push({ therapist_id: id, zone, position: i + 1 })
        })
      }
      await apiFetch('/api/queue/positions', {
        method: 'PUT',
        body: JSON.stringify({ store_id: storeId, positions: payload }),
      })
    } catch (e) {
      console.error('Failed to save queue positions:', e)
    } finally {
      setSaving(false)
    }
  }

  const activeTherapist = activeId ? therapistMap.get(activeId) : null

  return (
    <div className="space-y-4">
      {saving && (
        <div className="text-xs text-muted-foreground animate-pulse">儲存中…</div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Unassigned pool — horizontal */}
        <UnassignedPool ids={unassigned} therapistMap={therapistMap} />

        {/* Queue rows — each horizontal with scroll */}
        <div className="space-y-3">
          {ALL_ZONES.map((zone) => (
            <QueueColumn
              key={zone}
              zone={zone}
              therapistIds={positions[zone]}
              therapistMap={therapistMap}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTherapist ? (
            <TherapistCard therapist={activeTherapist} index={0} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
