import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
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
}

export function QueueBoard({ positions, therapistMap, storeId, onPositionsChange }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const findZone = (id: string): QueueZone | null => {
    for (const zone of ALL_ZONES) {
      if (positions[zone].includes(id)) return zone
    }
    return null
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return

    const activeZone = findZone(active.id as string)
    const overZone = findZone(over.id as string)

    // Only handle reordering within same zone
    if (activeZone && overZone && activeZone === overZone) {
      const items = [...positions[activeZone]]
      const oldIndex = items.indexOf(active.id as string)
      const newIndex = items.indexOf(over.id as string)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(items, oldIndex, newIndex)
        const newPositions = { ...positions, [activeZone]: reordered }
        onPositionsChange(newPositions)
        await savePositions(newPositions)
      }
    }
  }

  const handleRemove = async (therapistId: string) => {
    const zone = findZone(therapistId)
    if (!zone) return
    const newPositions = {
      ...positions,
      [zone]: positions[zone].filter((id) => id !== therapistId),
    }
    onPositionsChange(newPositions)
    await savePositions(newPositions)
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
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-3">
          {ALL_ZONES.map((zone) => (
            <QueueColumn
              key={zone}
              zone={zone}
              therapistIds={positions[zone]}
              therapistMap={therapistMap}
              onRemove={handleRemove}
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
