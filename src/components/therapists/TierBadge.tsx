import type { TherapistTier } from '@/types/therapist'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const TIER_CONFIG: Record<TherapistTier, { label: string; className: string }> = {
  bronze:   { label: '銅',   className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  silver:   { label: '銀',   className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  gold:     { label: '金',   className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  platinum: { label: '白金', className: 'bg-violet-100 text-violet-800 hover:bg-violet-100' },
}

export function TierBadge({ tier }: { tier: TherapistTier }) {
  const config = TIER_CONFIG[tier]
  return (
    <Badge variant="outline" className={cn('border-0 font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}
