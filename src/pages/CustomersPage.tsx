import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Customer, MembershipLevel } from '@/types/customer'
import { apiFetch } from '@/lib/api'
import { CustomerFilters } from '@/components/customers/CustomerFilters'
import { CustomerTable } from '@/components/customers/CustomerTable'
import { CustomerDetailDrawer } from '@/components/customers/CustomerDetailDrawer'

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Customer | null>(null)

  const [search, setSearch] = useState('')
  const [membership, setMembership] = useState<MembershipLevel | 'all'>('all')
  const [blacklisted, setBlacklisted] = useState('all')

  const hasActiveFilters = search !== '' || membership !== 'all' || blacklisted !== 'all'

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (membership !== 'all') params.set('membership_level', membership)
      if (blacklisted !== 'all') params.set('is_blacklisted', blacklisted)

      const qs = params.toString()
      const data = await apiFetch<Customer[]>(`/api/customers${qs ? `?${qs}` : ''}`)
      setCustomers(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }, [search, membership, blacklisted])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  // debounce search — server-side q param handles it, but we filter locally for instant feel
  const filtered = useMemo(() => customers, [customers])

  const handleClear = () => {
    setSearch('')
    setMembership('all')
    setBlacklisted('all')
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">客戶管理</h1>
        <p className="text-sm text-muted-foreground">
          {loading ? '載入中…' : `共 ${filtered.length} 位客戶`}
        </p>
      </div>

      <CustomerFilters
        search={search}
        onSearchChange={setSearch}
        membership={membership}
        onMembershipChange={setMembership}
        blacklisted={blacklisted}
        onBlacklistedChange={setBlacklisted}
        onClear={handleClear}
        hasActiveFilters={hasActiveFilters}
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <CustomerTable customers={filtered} loading={loading} onSelect={setSelected} />

      {selected && (
        <CustomerDetailDrawer customer={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
