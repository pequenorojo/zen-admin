export type TherapistStatus = 'available' | 'busy' | 'break' | 'offline'
export type CurrentStatus = 'WHITE' | 'YELLOW' | 'GREEN' | 'RED' | 'OFFLINE'
export type TherapistTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface TherapistSkill {
  id: string
  name: string
}

export interface Therapist {
  id: string
  store_id: string
  name: string
  rating: number
  status: TherapistStatus
  current_status: CurrentStatus
  rank_score: number
  total_sessions: number
  status_updated_at: string
  created_at: string
  employee_no: string | null
  gender: '男' | '女' | null
  phone: string | null
  hire_date: string | null
  bio: string | null
  therapist_points: number
  therapist_tier: TherapistTier
  is_active: boolean
  skills: TherapistSkill[]
}

export interface TherapistAppointment {
  id: string
  scheduled_at: string
  status: string
  service_name: string
  duration_min: number
  customer_name: string
}
