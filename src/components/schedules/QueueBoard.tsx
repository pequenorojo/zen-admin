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
import { arrayMove } from '@dnd-kit/sortable'
import type { CurrentStatus } from '@/types/therapist'
import type { QueueZone, QueueTherapistCard, QueuePosition } from '@/types/schedule'
import { ALL_ZONES } from '@/types/schedule'
import { QueueColumn } from './QueueColumn'
import { TherapistCard } from './TherapistCard'
import { apiFetch } from '@/lib/api'

type Positions = Record<QueueZone, string[]>

interface Props {
  positions: Positions
  therapistMap: Map<string, QueueTherapistCard>
  storeId: string
  onPositionsChange: (p: Positions) => void
  onRemove: (therapistId: string) => void
  onStatusChange: (therapistId: string, status: CurrentStatus) => void
}

export function QueueBoard({ positions, therapistMap, storeId, onPositionsChange, onRemove, onStatusChange }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const findZone = useCallback(
    (id: string): QueueZone | null => {
      // Check if id IS a zone (droppable container)
      if (ALL_ZONES.includes(id as QueueZone)) return id as QueueZone
      // Check which zone contains this item
      for (const zone of ALL_ZONES) {
        if (positions[zone].includes(id)) return zone
      }
      return null
    },
    [positions],
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeZone = findZone(active.id as string)
    const overZone = findZone(over.id as string)

    if (!activeZone || !overZone || activeZone === overZone) return

    // Cross-zone move
    const newPositions: Positions = {
      long: [...positions.long],
      short: [...positions.short],
      support: [...positions.support],
      nail: [...positions.nail],
    }

    // Remove from source zone
    newPositions[activeZone] = newPositions[activeZone].filter((id) => id !== active.id)

    // Insert at position in target zone
    const overIndex = newPositions[overZone].indexOf(over.id as string)
    if (overIndex >= 0) {
      newPositions[overZone].splice(overIndex, 0, active.id as string)
    } else {
      newPositions[overZone].push(active.id as string)
    }

    onPositionsChange(newPositions)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return

    const activeZone = findZone(active.id as string)
    const overZone = findZone(over.id as string)

    // Same zone — reorder
    if (activeZone && overZone && activeZone === overZone) {
      const items = [...positions[activeZone]]
      const oldIndex = items.indexOf(active.id as string)
      const newIndex = items.indexOf(over.id as string)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(items, oldIndex, newIndex)
        const newPositions = { ...positions, [activeZone]: reordered }
        onPositionsChange(newPositions)
        await savePositions(newPositions)
        return
      }
    }

    // Cross-zone move completed — save current state
    await savePositions(positions)
  }

  const savePositions = async (pos: Positions) => {
    setSaving(true)
    try {
      const payload: QueuePosition[] = []
      for (const zone of ALL_ZONES) {
        pos[zone].forEach((id, i) => {
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
        <div className="space-y-3">
          {ALL_ZONES.map((zone) => (
            <QueueColumn
              key={zone}
              zone={zone}
              therapistIds={positions[zone]}
              therapistMap={therapistMap}
              onRemove={onRemove}
              onStatusChange={onStatusChange}
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
