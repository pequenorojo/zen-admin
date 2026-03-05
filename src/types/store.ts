export interface StoreMetadata {
  acceptance_rate?: number
  yellow_threshold_min?: number
  [key: string]: unknown
}

export interface Store {
  id: string
  code: string
  name: string
  address: string | null
  phone: string | null
  timezone: string
  is_active: boolean
  metadata: StoreMetadata
  temp_closure_start: string | null
  temp_closure_end: string | null
  created_at: string
}

export interface StoreStats {
  id: string
  therapist_count: number
  in_service: number
  available: number
  today_orders: number
  today_completed: number
  today_revenue: string
}
