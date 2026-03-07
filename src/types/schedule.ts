import type { CurrentStatus } from './therapist'

// API response types
export interface OnDutyTherapist {
  schedule_id: string
  therapist_id: string
  day_of_week: number
  start_time: string   // "09:00:00"
  end_time: string     // "21:00:00"
  therapist_name: string
  employee_no: string | null
  current_status: CurrentStatus
  rank_score: number
  gender: '男' | '女' | null
}

export interface OnDutyResponse {
  date: string
  day_of_week: number
  therapists: OnDutyTherapist[]
}

export interface AttendanceRecord {
  therapist_id: string
  name: string
  employee_no: string | null
  gender: '男' | '女' | null
  attendance_id: string | null
  status: 'present' | 'absent' | 'late' | 'leave' | 'day_off'
  check_in_at: string | null
  check_out_at: string | null
}

export interface QueuePosition {
  therapist_id: string
  zone: string
  position: number
}

// UI types
export type QueueZone = 'long' | 'short' | 'support' | 'nail'
export type AttendanceDisplayStatus = '已出勤' | '尚未出勤' | '下線'

export const ZONE_LABELS: Record<QueueZone, string> = {
  long: '長單', short: '短單', support: '支援', nail: '修指甲/修腳皮',
}
export const ALL_ZONES: QueueZone[] = ['long', 'short', 'support', 'nail']

export interface RosterTherapist {
  therapist_id: string
  therapist_name: string
  employee_no: string | null
  gender: '男' | '女' | null
  current_status: CurrentStatus
  start_time: string
  end_time: string
  attendance_status: AttendanceDisplayStatus
}

export interface QueueTherapistCard {
  therapist_id: string
  therapist_name: string
  employee_no: string | null
  gender: '男' | '女' | null
  current_status: CurrentStatus
  rank_score: number
}
