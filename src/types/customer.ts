export type MembershipLevel = '銅' | '銀' | '金' | '白金' | '黑金'

export type BlacklistScope = '全系統' | '店舖' | '師傅'

export interface Customer {
  id: string
  name: string
  phone: string
  gender: '男' | '女' | null
  email: string | null
  membership_level: MembershipLevel
  points_balance: number
  total_visits: number
  is_blacklisted: boolean
  last_visit_at: string | null
  created_at: string
  notes: string | null
  blacklist_scope: BlacklistScope | null
  blacklist_target_id: string | null
  blacklist_target_name: string | null
  referrer_name: string | null
}

export interface CustomerStats {
  total_visits_all: number
  completed_count: number
  total_spend: number
  spend_30d: number
  spend_90d: number
  first_visit_at: string | null
  last_visit_at: string | null
  avg_spend: number
  top_services: { service_name: string; count: number }[]
}

export interface CustomerAppointment {
  id: string
  scheduled_at: string
  duration_min: number
  status: string
  therapist_preference: string
  service_name: string | null
  service_price: number | null
  therapist_name: string | null
  created_at: string
}
