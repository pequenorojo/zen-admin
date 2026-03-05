export type LocationType = 'chair' | 'bed' | 'other'

export interface Location {
  id: string
  store_id: string
  equipment_id: string | null
  label: string
  type: LocationType
  floor: number
  room: string | null
  zone: string | null
  is_occupied: boolean
  priority_score: number
  current_therapist_id: string | null
  current_appointment_id: string | null
  expected_available_at: string | null
  last_occupied_at: string | null
  notes: string | null
  updated_at: string
  // joined fields
  therapist_name: string | null
  therapist_queue_status: string | null
  appointment_id: string | null
  appt_scheduled_at: string | null
  appt_duration_min: number | null
  appt_status: string | null
  customer_name: string | null
  customer_gender: string | null
  service_name: string | null
}

export interface LocationAvailability {
  id: string
  label: string
  type: LocationType
  floor: number
  room: string | null
  zone: string | null
  priority_score: number
  is_occupied: boolean
  current_appointment_id: string | null
  expected_available_at: string | null
  seat_occupied_now: boolean
  next_free_at: string | null
  appt_id: string | null
  appt_scheduled_at: string | null
  appt_duration_min: number | null
  customer_name: string | null
  service_name: string | null
  therapist_name: string | null
}

export interface LocationAvailabilityResponse {
  at: string
  summary: { total: number; busy: number; free: number }
  locations: LocationAvailability[]
}

export interface LocationStats {
  location_id: string
  label: string
  type: LocationType
  floor: number
  session_count: number
  total_minutes: number
}
