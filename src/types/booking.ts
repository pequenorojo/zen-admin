export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'checked_in' | 'no_show'

export interface Booking {
  id: string
  store_id: string
  customer_id: string
  therapist_id: string | null
  service_id: string
  scheduled_at: string          // ISO 8601
  duration_min: number
  status: BookingStatus
  wolfram_score: number | null
  notes: string | null
  booking_group_id: string | null
  person_index: number
  therapist_preference: string  // '指定' | '不指定' | '男師' | '女師'
  created_at: string
  updated_at: string
  customer_name: string
  customer_phone: string
  therapist_name: string | null
  service_name: string
  service_price: number
}
