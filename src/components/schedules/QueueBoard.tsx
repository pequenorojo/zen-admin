import { useState, useEffect, useRef } from 'react'
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

// Pure function — no closure dependency
function findZoneIn(pos: Positions, id: string): QueueZone | null {
  if (ALL_ZONES.includes(id as QueueZone)) return id as QueueZone
  for (const zone of ALL_ZONES) {
    if (pos[zone].includes(id)) return zone
  }
  return null
}

function clonePositions(pos: Positions): Positions {
  return { long: [...pos.long], short: [...pos.short], support: [...pos.support], nail: [...pos.nail] }
}

export function QueueBoard({ positions, therapistMap, storeId, onPositionsChange, onRemove, onStatusChange }: Props) {
  const [localPositions, setLocalPositions] = useState<Positions>(positions)
  const draggingRef = useRef(false)

  useEffect(() => {
    if (!draggingRef.current) setLocalPositions(positions)
  }, [positions])

  const [activeId, setActiveId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    draggingRef.current = true
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setLocalPositions((prev) => {
      const activeZone = findZoneIn(prev, active.id as string)
      const overZone = findZoneIn(prev, over.id as string)

      if (!activeZone || !overZone || activeZone === overZone) return prev

      const next = clonePositions(prev)

      // Remove from source
      next[activeZone] = next[activeZone].filter((id) => id !== active.id)

      // Insert at target position
      const overIndex = next[overZone].indexOf(over.id as string)
      if (overIndex >= 0) {
        next[overZone].splice(overIndex, 0, active.id as string)
      } else {
        next[overZone].push(active.id as string)
      }

      return next
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    draggingRef.current = false
    setActiveId(null)

    if (!over || active.id === over.id) {
      onPositionsChange(localPositions)
      return
    }

    // Use functional update for same-zone reorder
    setLocalPositions((prev) => {
      const activeZone = findZoneIn(prev, active.id as string)
      const overZone = findZoneIn(prev, over.id as string)

      if (activeZone && overZone && activeZone === overZone) {
        const items = [...prev[activeZone]]
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          return { ...prev, [activeZone]: arrayMove(items, oldIndex, newIndex) }
        }
      }
      return prev
    })

    // Read latest state after update and sync
    // Use setTimeout to ensure state is committed
    setTimeout(() => {
      setLocalPositions((final) => {
        onPositionsChange(final)
        savePositions(final)
        return final
      })
    }, 0)
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
              therapistIds={localPositions[zone]}
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
