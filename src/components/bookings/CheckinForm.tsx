import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Booking } from '@/types/booking'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Therapist {
  id: string
  name: string
  employee_no: string
  gender: string
  current_status: string
}

interface Location {
  id: string
  label: string
  type: string
  floor: string | null
  seat_occupied_now: boolean
}

interface CheckinFormProps {
  booking: Booking
  storeId: string
  onSubmit: (overrides: { therapist_id?: string; location_id?: string }) => Promise<void>
  onCancel: () => void
  submitting: boolean
  error: string | null
}

function inferLocationType(booking: Booking): 'chair' | 'bed' | null {
  if (booking.seat1_type) return booking.seat1_type
  const name = booking.service_name
  if (/腳底/.test(name)) return 'chair'
  if (/全身|身體/.test(name)) return 'bed'
  return null
}

export function CheckinForm({ booking, storeId, onSubmit, onCancel, submitting, error }: CheckinFormProps) {
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedTherapist, setSelectedTherapist] = useState<string>(booking.therapist_id || '')
  const [selectedLocation, setSelectedLocation] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const locType = inferLocationType(booking)

    Promise.all([
      apiFetch<Therapist[]>(`/api/therapists?store_id=${storeId}`),
      apiFetch<{ locations: Location[] }>(`/api/locations/availability?store_id=${storeId}`),
    ]).then(([allTherapists, locData]) => {
      if (cancelled) return

      // Filter available therapists: active + WHITE or YELLOW status
      let available = allTherapists.filter(
        (t) => t.current_status === 'WHITE' || t.current_status === 'YELLOW',
      )

      // Gender filter based on therapist_preference
      if (booking.therapist_preference === '男師') {
        available = available.filter((t) => t.gender === '男')
      } else if (booking.therapist_preference === '女師') {
        available = available.filter((t) => t.gender === '女')
      }

      // Keep pre-assigned therapist in list even if status changed
      if (booking.therapist_id && !available.find((t) => t.id === booking.therapist_id)) {
        const assigned = allTherapists.find((t) => t.id === booking.therapist_id)
        if (assigned) available = [assigned, ...available]
      }

      setTherapists(available)

      // Filter locations: not occupied + type match
      let freeLocations = locData.locations.filter((l) => !l.seat_occupied_now)
      if (locType) {
        freeLocations = freeLocations.filter((l) => l.type === locType)
      }
      setLocations(freeLocations)

      // Pre-select therapist
      if (booking.therapist_id && available.find((t) => t.id === booking.therapist_id)) {
        setSelectedTherapist(booking.therapist_id)
      } else if (available.length > 0) {
        setSelectedTherapist(available[0].id)
      }

      // Pre-select first matching free location
      if (freeLocations.length > 0) {
        setSelectedLocation(freeLocations[0].id)
      }

      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [booking, storeId])

  const handleSubmit = () => {
    const overrides: { therapist_id?: string; location_id?: string } = {}
    if (selectedTherapist && selectedTherapist !== booking.therapist_id) {
      overrides.therapist_id = selectedTherapist
    }
    if (selectedLocation) {
      overrides.location_id = selectedLocation
    }
    onSubmit(overrides)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">載入師傅與位置…</span>
      </div>
    )
  }

  const statusLabel: Record<string, string> = {
    WHITE: '待班',
    YELLOW: '等勞點',
    GREEN: '休息中',
    RED: '工作中',
    OFFLINE: '下線',
  }

  return (
    <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
      <p className="text-sm font-medium">確認報到 — 可調整師傅與位置</p>

      {/* Service (read-only) */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">服務項目</label>
        <p className="text-sm">{booking.service_name}（{booking.duration_min} 分鐘）</p>
      </div>

      {/* Therapist select */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">師傅</label>
        {therapists.length > 0 ? (
          <Select value={selectedTherapist} onValueChange={setSelectedTherapist}>
            <SelectTrigger>
              <SelectValue placeholder="選擇師傅" />
            </SelectTrigger>
            <SelectContent>
              {therapists.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.employee_no} {t.name}（{t.gender === '男' ? '男' : '女'}）— {statusLabel[t.current_status] || t.current_status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-destructive">目前無可用師傅</p>
        )}
      </div>

      {/* Location select */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">位置</label>
        {locations.length > 0 ? (
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger>
              <SelectValue placeholder="選擇位置" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.label}（{l.type === 'chair' ? '椅' : '床'}）{l.floor ? `${l.floor}F` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-destructive">目前無空閒位置</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={submitting || !selectedTherapist}
          onClick={handleSubmit}
        >
          {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
          確認報到
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={submitting}
          onClick={onCancel}
        >
          取消
        </Button>
      </div>
    </div>
  )
}
