import type { CurrentStatus } from '@/types/therapist'
import { cn } from '@/lib/utils'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'

const STATUS_CONFIG: Record<CurrentStatus, { label: string; color: string; bg: string }> = {
  WHITE:   { label: '待班中', color: 'bg-gray-400',   bg: 'bg-gray-100 text-gray-700' },
  YELLOW:  { label: '等勞點', color: 'bg-yellow-400', bg: 'bg-yellow-100 text-yellow-800' },
  GREEN:   { label: '休息中', color: 'bg-green-500',  bg: 'bg-green-100 text-green-800' },
  RED:     { label: '工作中', color: 'bg-red-500',    bg: 'bg-red-100 text-red-800' },
  OFFLINE: { label: '下線',   color: 'bg-gray-300',   bg: 'bg-gray-100 text-gray-500' },
}

export function StatusDot({ status }: { status: CurrentStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-block h-2.5 w-2.5 rounded-full', config.color)} />
      </TooltipTrigger>
      <TooltipContent>{config.label}</TooltipContent>
    </Tooltip>
  )
}

export function StatusLabel({ status }: { status: CurrentStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', config.bg)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', config.color)} />
      {config.label}
    </span>
  )
}
