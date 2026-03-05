import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Customer, MembershipLevel } from '@/types/customer'
import { apiFetch } from '@/lib/api'
import { CustomerFilters } from '@/components/customers/CustomerFilters'
import { CustomerList } from '@/components/customers/CustomerList'
import { CustomerDetailPanel } from '@/components/customers/CustomerDetailPanel'

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

  const filtered = useMemo(() => customers, [customers])

  const handleClear = () => {
    setSearch('')
    setMembership('all')
    setBlacklisted('all')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header + Filters */}
      <div className="shrink-0 space-y-4 border-b px-6 py-4">
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
      </div>

      {/* Master-Detail */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: List */}
        <div className="w-[360px] shrink-0 overflow-y-auto border-r">
          <CustomerList
            customers={filtered}
            loading={loading}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
        </div>

        {/* Right: Detail */}
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="p-6">
              <CustomerDetailPanel customer={selected} />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>選擇一位客戶以查看詳情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
