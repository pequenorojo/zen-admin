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
  const [unassigned, setUnassigned] = useState<string[]>([])

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

  // Build roster list — all active therapists
  const attendanceMap = useMemo(
    () => new Map(attendance.map((a) => [a.therapist_id, a])),
    [attendance],
  )

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
    const assigned = new Set<string>()

    for (const qp of queuePositions) {
      const zone = qp.zone as QueueZone
      if (ALL_ZONES.includes(zone) && therapistMap.has(qp.therapist_id)) {
        newPositions[zone].push(qp.therapist_id)
        assigned.add(qp.therapist_id)
      }
    }

    // Sort each zone by position
    for (const zone of ALL_ZONES) {
      const zonePositions = queuePositions.filter((qp) => qp.zone === zone)
      const posMap = new Map(zonePositions.map((qp) => [qp.therapist_id, qp.position]))
      newPositions[zone].sort((a, b) => (posMap.get(a) ?? 99) - (posMap.get(b) ?? 99))
    }

    // Unassigned = active therapists who are 已出勤 but not in any queue
    const unassignedIds: string[] = []
    for (const t of therapists) {
      if (assigned.has(t.id)) continue
      const status = deriveAttendanceStatus(attendanceMap.get(t.id), t)
      if (status === '已出勤') {
        unassignedIds.push(t.id)
      }
    }
    setPositions(newPositions)
    setUnassigned(unassignedIds)
  }, [queuePositions, therapistMap, therapists, attendanceMap])

  // Summary counts
  const presentCount = roster.filter((t) => t.attendance_status === '已出勤').length
  const totalCount = roster.length

  const handlePositionsChange = (p: Positions, u: string[]) => {
    setPositions(p)
    setUnassigned(u)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b px-6 py-3">
        <h1 className="text-lg font-semibold">排班管理</h1>
        <span className="text-sm text-muted-foreground">{displayDate}</span>
        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
          出勤 {presentCount}/{totalCount}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Calendar + Roster */}
        <div className="flex w-72 shrink-0 flex-col border-r">
          <ScheduleCalendar selected={selectedDate} onSelect={setSelectedDate} />
          <div className="flex-1 overflow-hidden flex flex-col px-3 py-2">
            <h2 className="text-sm font-semibold mb-2">出勤名單</h2>
            <RosterList therapists={roster} loading={loading} />
          </div>
        </div>

        {/* Main — Queue Board */}
        <div className="flex-1 overflow-y-auto p-6">
          {store ? (
            <QueueBoard
              positions={positions}
              unassigned={unassigned}
              therapistMap={therapistMap}
              storeId={store.id}
              onPositionsChange={handlePositionsChange}
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
