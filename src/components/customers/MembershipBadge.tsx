import type { MembershipLevel } from '@/types/customer'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const LEVEL_CONFIG: Record<MembershipLevel, { className: string }> = {
  '銅':  { className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  '銀':  { className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  '金':  { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  '白金': { className: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-100' },
  '黑金': { className: 'bg-gray-900 text-yellow-300 hover:bg-gray-900' },
}

export function MembershipBadge({ level }: { level: MembershipLevel }) {
  const config = LEVEL_CONFIG[level]
  return (
    <Badge variant="outline" className={cn('border-0 font-medium', config.className)}>
      {level}
    </Badge>
  )
}
