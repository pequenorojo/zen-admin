import { useState } from 'react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Props {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
}

export function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[240px] justify-start text-left font-normal',
            !value?.from && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, 'MM/dd', { locale: zhTW })} –{' '}
                {format(value.to, 'MM/dd', { locale: zhTW })}
              </>
            ) : (
              format(value.from, 'yyyy/MM/dd', { locale: zhTW })
            )
          ) : (
            '選擇日期範圍'
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={(range) => {
            onChange(range)
            if (range?.from && range?.to) setOpen(false)
          }}
          numberOfMonths={2}
          locale={zhTW}
        />
      </PopoverContent>
    </Popover>
  )
}
