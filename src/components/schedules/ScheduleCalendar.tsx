import { zhTW } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'

interface Props {
  selected: Date
  onSelect: (d: Date) => void
}

export function ScheduleCalendar({ selected, onSelect }: Props) {
  return (
    <div className="border-b pb-3">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={(d) => d && onSelect(d)}
        locale={zhTW}
        className="w-full"
      />
    </div>
  )
}
