import { useState, useEffect, useRef } from 'react'
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    draggingRef.current = false
    setActiveId(null)
    if (!over || active.id === over.id) return

    // Find which zone both items are in
    setLocalPositions((prev) => {
      for (const zone of ALL_ZONES) {
        const items = prev[zone]
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(items, oldIndex, newIndex)
          const next = { ...prev, [zone]: reordered }
          onPositionsChange(next)
          savePositions(next)
          return next
        }
      }
      return prev
    })
  }

  // Move card between zones via dropdown
  const handleZoneChange = (therapistId: string, from: QueueZone, to: QueueZone) => {
    if (from === to) return
    const next: Positions = {
      long: [...positions.long],
      short: [...positions.short],
      support: [...positions.support],
      nail: [...positions.nail],
    }
    next[from] = next[from].filter((id) => id !== therapistId)
    next[to].push(therapistId)
    setLocalPositions(next)
    onPositionsChange(next)
    savePositions(next)
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
  const activeZone = activeId
    ? ALL_ZONES.find((z) => localPositions[z].includes(activeId)) ?? 'long'
    : 'long'

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
              therapistIds={localPositions[zone]}
              therapistMap={therapistMap}
              onRemove={onRemove}
              onStatusChange={onStatusChange}
              onZoneChange={handleZoneChange}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTherapist ? (
            <TherapistCard
              therapist={activeTherapist}
              index={0}
              currentZone={activeZone as QueueZone}
              overlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
