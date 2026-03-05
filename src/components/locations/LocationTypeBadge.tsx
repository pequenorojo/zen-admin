import type { LocationType } from '@/types/location'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const TYPE_CONFIG: Record<LocationType, { label: string; className: string }> = {
  chair: { label: '腳位', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  bed:   { label: '床位', className: 'bg-violet-100 text-violet-800 hover:bg-violet-100' },
  other: { label: '其他', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
}

export function LocationTypeBadge({ type }: { type: LocationType }) {
  const config = TYPE_CONFIG[type]
  return (
    <Badge variant="outline" className={cn('border-0 font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}
