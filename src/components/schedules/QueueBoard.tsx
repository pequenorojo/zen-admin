import { useState, useCallback, useEffect, useRef } from 'react'
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
  // Local positions during drag to avoid parent re-render
  const [localPositions, setLocalPositions] = useState<Positions>(positions)
  const isDragging = useRef(false)

  // Sync from parent when not dragging
  useEffect(() => {
    if (!isDragging.current) {
      setLocalPositions(positions)
    }
  }, [positions])

  const [activeId, setActiveId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const findZone = useCallback(
    (id: string): QueueZone | null => {
      if (ALL_ZONES.includes(id as QueueZone)) return id as QueueZone
      for (const zone of ALL_ZONES) {
        if (localPositions[zone].includes(id)) return zone
      }
      return null
    },
    [localPositions],
  )

  const handleDragStart = (event: DragStartEvent) => {
    isDragging.current = true
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeZone = findZone(active.id as string)
    const overZone = findZone(over.id as string)

    if (!activeZone || !overZone || activeZone === overZone) return

    // Cross-zone move — update local state only
    setLocalPositions((prev) => {
      const next: Positions = {
        long: [...prev.long],
        short: [...prev.short],
        support: [...prev.support],
        nail: [...prev.nail],
      }

      // Remove from source
      next[activeZone] = next[activeZone].filter((id) => id !== active.id)

      // Insert at position in target
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
    isDragging.current = false
    setActiveId(null)

    if (!over || active.id === over.id) {
      // No move — sync local back to parent
      onPositionsChange(localPositions)
      return
    }

    let finalPositions = localPositions

    // Check for same-zone reorder
    const activeZone = findZone(active.id as string)
    const overZone = findZone(over.id as string)

    if (activeZone && overZone && activeZone === overZone) {
      const items = [...localPositions[activeZone]]
      const oldIndex = items.indexOf(active.id as string)
      const newIndex = items.indexOf(over.id as string)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        finalPositions = { ...localPositions, [activeZone]: arrayMove(items, oldIndex, newIndex) }
      }
    }

    // Sync to parent and save
    setLocalPositions(finalPositions)
    onPositionsChange(finalPositions)
    await savePositions(finalPositions)
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
