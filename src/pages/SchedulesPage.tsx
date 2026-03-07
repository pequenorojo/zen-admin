import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { useStore } from '@/context/StoreContext'
import { apiFetch } from '@/lib/api'
import type { Therapist } from '@/types/therapist'
import type {
  AttendanceRecord,
  QueuePosition,
  QueueZone,
  RosterTherapist,
  QueueTherapistCard,
  AttendanceDisplayStatus,
} from '@/types/schedule'
import { ALL_ZONES } from '@/types/schedule'
import { ScheduleCalendar } from '@/components/schedules/ScheduleCalendar'
import { RosterList } from '@/components/schedules/RosterList'
import { QueueBoard } from '@/components/schedules/QueueBoard'

type Positions = Record<QueueZone, string[]>

function deriveAttendanceStatus(
  record: AttendanceRecord | undefined,
  therapist: Therapist,
): AttendanceDisplayStatus {
  if (record?.check_in_at && record?.check_out_at) return '下線'
  if (record?.check_in_at && therapist.current_status === 'OFFLINE') return '下線'
  if (therapist.current_status !== 'OFFLINE') return '已出勤'
  return '尚未出勤'
}

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
    // Queue positions fetched separately — may fail if table doesn't exist yet
    try {
      const queueRes = await apiFetch<QueuePosition[]>(`/api/queue/positions?store_id=${store.id}`)
      setQueuePositions(Array.isArray(queueRes) ? queueRes : [])
    } catch {
      setQueuePositions([])
    }
    setLoading(false)
  }, [store, dateStr])

  useEffect(() => { fetchData() }, [fetchData])

  // Build attendance map
  const attendanceMap = useMemo(
    () => new Map(attendance.map((a) => [a.therapist_id, a])),
    [attendance],
  )

  // Build roster list
  const roster = useMemo<RosterTherapist[]>(
    () => therapists.map((t) => ({
      therapist_id: t.id,
      therapist_name: t.name,
      employee_no: t.employee_no,
      gender: t.gender,
      current_status: t.current_status,
      attendance_status: deriveAttendanceStatus(attendanceMap.get(t.id), t),
    })),
    [therapists, attendanceMap],
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

    // Sort each zone by position
    for (const zone of ALL_ZONES) {
      const zonePositions = queuePositions.filter((qp) => qp.zone === zone)
      const posMap = new Map(zonePositions.map((qp) => [qp.therapist_id, qp.position]))
      newPositions[zone].sort((a, b) => (posMap.get(a) ?? 99) - (posMap.get(b) ?? 99))
    }

    setPositions(newPositions)
  }, [queuePositions, therapistMap])

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

  // Handle assign/unassign from roster dropdown
  const handleAssign = (therapistId: string, zone: QueueZone | null) => {
    const newPositions: Positions = { long: [], short: [], support: [], nail: [] }
    // Copy and remove from all zones
    for (const z of ALL_ZONES) {
      newPositions[z] = positions[z].filter((id) => id !== therapistId)
    }
    // Add to new zone (at end)
    if (zone) {
      newPositions[zone].push(therapistId)
    }
    setPositions(newPositions)
    // Save to backend
    savePositions(newPositions)
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
