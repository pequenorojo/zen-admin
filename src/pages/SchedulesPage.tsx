import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { useStore } from '@/context/StoreContext'
import { apiFetch } from '@/lib/api'
import type { Therapist, CurrentStatus } from '@/types/therapist'
import type {
  AttendanceRecord,
  QueuePosition,
  QueueZone,
  RosterTherapist,
  QueueTherapistCard,
} from '@/types/schedule'
import { ALL_ZONES } from '@/types/schedule'
import { ScheduleCalendar } from '@/components/schedules/ScheduleCalendar'
import { RosterList } from '@/components/schedules/RosterList'
import { QueueBoard } from '@/components/schedules/QueueBoard'

type Positions = Record<QueueZone, string[]>

export function SchedulesPage() {
  const { current: store } = useStore()
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [loading, setLoading] = useState(true)

  // Raw API data
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [queuePositions, setQueuePositions] = useState<QueuePosition[]>([])

  // Positions state for drag & drop
  const [positions, setPositions] = useState<Positions>({ long: [], short: [], support: [], nail: [] })

  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const displayDate = format(selectedDate, 'M月d日 EEEE', { locale: zhTW })

  const fetchData = useCallback(async () => {
    if (!store) return
    setLoading(true)
    try {
      const [therapistsRes, attendanceRes] = await Promise.all([
        apiFetch<Therapist[]>(`/api/therapists?store_id=${store.id}`),
        apiFetch<AttendanceRecord[]>(`/api/attendance/therapists?date=${dateStr}&store_id=${store.id}`),
      ])
      setTherapists(therapistsRes.filter((t) => t.is_active))
      setAttendance(attendanceRes)
    } catch (e) {
      console.error('Failed to fetch schedule data:', e)
    }
    try {
      const queueRes = await apiFetch<QueuePosition[]>(`/api/queue/positions?store_id=${store.id}`)
      setQueuePositions(Array.isArray(queueRes) ? queueRes : [])
    } catch {
      setQueuePositions([])
    }
    setLoading(false)
  }, [store, dateStr])

  useEffect(() => { fetchData() }, [fetchData])

  // Compute assignments map: therapist_id → zone
  const assignments = useMemo(() => {
    const map = new Map<string, QueueZone>()
    for (const zone of ALL_ZONES) {
      for (const id of positions[zone]) {
        map.set(id, zone)
      }
    }
    return map
  }, [positions])

  // Build roster list — attendance based on assignment
  const roster = useMemo<RosterTherapist[]>(
    () => therapists.map((t) => {
      const isAssigned = assignments.has(t.id)
      const isOffline = t.current_status === 'OFFLINE'
      return {
        therapist_id: t.id,
        therapist_name: t.name,
        employee_no: t.employee_no,
        gender: t.gender,
        current_status: t.current_status,
        attendance_status: isOffline ? '下線' : isAssigned ? '已出勤' : '尚未出勤',
      }
    }),
    [therapists, assignments],
  )

  // Build therapist map for queue board
  const therapistMap = useMemo(() => {
    const map = new Map<string, QueueTherapistCard>()
    for (const t of therapists) {
      map.set(t.id, {
        therapist_id: t.id,
        therapist_name: t.name,
        employee_no: t.employee_no,
        gender: t.gender,
        current_status: t.current_status,
        rank_score: t.rank_score,
      })
    }
    return map
  }, [therapists])

  // Compute initial positions from API queue data
  useEffect(() => {
    const newPositions: Positions = { long: [], short: [], support: [], nail: [] }

    for (const qp of queuePositions) {
      const zone = qp.zone as QueueZone
      if (ALL_ZONES.includes(zone) && therapistMap.has(qp.therapist_id)) {
        newPositions[zone].push(qp.therapist_id)
      }
    }

    for (const zone of ALL_ZONES) {
      const zonePositions = queuePositions.filter((qp) => qp.zone === zone)
      const posMap = new Map(zonePositions.map((qp) => [qp.therapist_id, qp.position]))
      newPositions[zone].sort((a, b) => (posMap.get(a) ?? 99) - (posMap.get(b) ?? 99))
    }

    setPositions(newPositions)
  }, [queuePositions, therapistMap])

  // Handle assign/unassign from roster dropdown
  const handleAssign = (therapistId: string, zone: QueueZone | null) => {
    const newPositions: Positions = {
      long: positions.long.filter((id) => id !== therapistId),
      short: positions.short.filter((id) => id !== therapistId),
      support: positions.support.filter((id) => id !== therapistId),
      nail: positions.nail.filter((id) => id !== therapistId),
    }
    if (zone) {
      newPositions[zone].push(therapistId)
    }
    setPositions(newPositions)
    savePositions(newPositions)
  }

  // Handle remove from queue (back to unassigned)
  const handleRemove = (therapistId: string) => {
    handleAssign(therapistId, null)
  }

  // Handle status change on card
  const handleStatusChange = async (therapistId: string, status: CurrentStatus) => {
    // Optimistic update local state
    setTherapists((prev) =>
      prev.map((t) => t.id === therapistId ? { ...t, current_status: status } : t),
    )

    // If OFFLINE, remove from queue
    if (status === 'OFFLINE') {
      const newPositions: Positions = {
        long: positions.long.filter((id) => id !== therapistId),
        short: positions.short.filter((id) => id !== therapistId),
        support: positions.support.filter((id) => id !== therapistId),
        nail: positions.nail.filter((id) => id !== therapistId),
      }
      setPositions(newPositions)
      savePositions(newPositions)
    }

    // Update backend
    try {
      await apiFetch(`/api/therapists/${therapistId}`, {
        method: 'PATCH',
        body: JSON.stringify({ current_status: status }),
      })
    } catch (e) {
      console.error('Failed to update therapist status:', e)
    }
  }

  const savePositions = async (pos: Positions) => {
    if (!store) return
    try {
      const payload: QueuePosition[] = []
      for (const zone of ALL_ZONES) {
        pos[zone].forEach((id, i) => {
          payload.push({ therapist_id: id, zone, position: i + 1 })
        })
      }
      await apiFetch('/api/queue/positions', {
        method: 'PUT',
        body: JSON.stringify({ store_id: store.id, positions: payload }),
      })
    } catch (e) {
      console.error('Failed to save queue positions:', e)
    }
  }

  // Summary counts
  const presentCount = roster.filter((t) => t.attendance_status === '已出勤').length
  const totalCount = roster.length
  const assignedCount = assignments.size

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b px-6 py-3">
        <h1 className="text-lg font-semibold">排班管理</h1>
        <span className="text-sm text-muted-foreground">{displayDate}</span>
        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
          出勤 {presentCount}/{totalCount}
        </span>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          已分配 {assignedCount}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Calendar + Roster */}
        <div className="flex w-80 shrink-0 flex-col border-r">
          <ScheduleCalendar selected={selectedDate} onSelect={setSelectedDate} />
          <div className="flex-1 overflow-hidden flex flex-col px-3 py-2">
            <h2 className="text-sm font-semibold mb-2">出勤名單</h2>
            <RosterList
              therapists={roster}
              loading={loading}
              assignments={assignments}
              onAssign={handleAssign}
            />
          </div>
        </div>

        {/* Main — Queue Board */}
        <div className="flex-1 overflow-y-auto p-6">
          {store ? (
            <QueueBoard
              positions={positions}
              therapistMap={therapistMap}
              storeId={store.id}
              onPositionsChange={setPositions}
              onRemove={handleRemove}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              請先選擇店舖
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
