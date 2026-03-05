import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Therapist, CurrentStatus } from '@/types/therapist'
import { apiFetch } from '@/lib/api'
import { useStore } from '@/context/StoreContext'
import { TherapistFilters } from '@/components/therapists/TherapistFilters'
import { TherapistList } from '@/components/therapists/TherapistList'
import { TherapistDetailPanel } from '@/components/therapists/TherapistDetailPanel'

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
    <div className="flex h-full flex-col">
      {/* Header + Filters */}
      <div className="shrink-0 space-y-4 border-b px-6 py-4">
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
      </div>

      {/* Master-Detail */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: List */}
        <div className="w-[360px] shrink-0 overflow-y-auto border-r">
          <TherapistList
            therapists={filtered}
            loading={loading}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
        </div>

        {/* Right: Detail */}
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="p-6">
              <TherapistDetailPanel therapist={selected} />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>選擇一位師傅以查看詳情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
