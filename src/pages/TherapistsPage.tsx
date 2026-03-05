import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Therapist, CurrentStatus } from '@/types/therapist'
import { apiFetch } from '@/lib/api'
import { useStore } from '@/context/StoreContext'
import { TherapistFilters } from '@/components/therapists/TherapistFilters'
import { TherapistTable } from '@/components/therapists/TherapistTable'
import { TherapistDetailDrawer } from '@/components/therapists/TherapistDetailDrawer'

export function TherapistsPage() {
  const { current: store } = useStore()
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Therapist | null>(null)

  const [search, setSearch] = useState('')
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | 'all'>('all')
  const [gender, setGender] = useState('all')

  const hasActiveFilters = search !== '' || currentStatus !== 'all' || gender !== 'all'

  const fetchTherapists = useCallback(async () => {
    if (!store) return
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<Therapist[]>(`/api/therapists?store_id=${store.id}`)
      setTherapists(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch therapists')
    } finally {
      setLoading(false)
    }
  }, [store])

  useEffect(() => { fetchTherapists() }, [fetchTherapists])

  const filtered = useMemo(() => {
    let list = therapists

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.employee_no && t.employee_no.includes(q)) ||
          (t.phone && t.phone.includes(q)),
      )
    }

    if (currentStatus !== 'all') {
      list = list.filter((t) => t.current_status === currentStatus)
    }

    if (gender !== 'all') {
      list = list.filter((t) => t.gender === gender)
    }

    return list
  }, [therapists, search, currentStatus, gender])

  const handleClear = () => {
    setSearch('')
    setCurrentStatus('all')
    setGender('all')
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">師傅管理</h1>
        <p className="text-sm text-muted-foreground">
          {loading ? '載入中…' : `共 ${filtered.length} 位師傅`}
        </p>
      </div>

      <TherapistFilters
        search={search}
        onSearchChange={setSearch}
        currentStatus={currentStatus}
        onCurrentStatusChange={setCurrentStatus}
        gender={gender}
        onGenderChange={setGender}
        onClear={handleClear}
        hasActiveFilters={hasActiveFilters}
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <TherapistTable therapists={filtered} loading={loading} onSelect={setSelected} />

      {selected && (
        <TherapistDetailDrawer therapist={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
