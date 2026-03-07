import type { CurrentStatus } from './therapist'

// API response types (kept for future use)
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
  attendance_status: AttendanceDisplayStatus
}

export interface QueueTherapistCard {
  therapist_id: string
  therapist_name: string
  employee_no: string | null
  gender: '男' | '女' | null
  current_status: CurrentStatus
  rank_score: number
  current_appointment_id?: string
  current_service_name?: string
  current_customer_name?: string
  current_scheduled_at?: string
  current_duration_min?: number
}
