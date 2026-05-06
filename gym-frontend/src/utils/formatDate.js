import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)
dayjs.locale('vi')

export const fmt   = (d, f = 'DD/MM/YYYY')  => d ? dayjs(d).format(f) : '—'
export const fmtDT = (d) => d ? dayjs(d).format('HH:mm DD/MM/YYYY') : '—'
export const fmtTime = (d) => d ? dayjs(d).format('HH:mm') : '—'
export const fromNow = (d) => d ? dayjs(d).fromNow() : '—'
export const daysLeft = (d) => {
  if (!d) return null
  return dayjs(d).diff(dayjs(), 'day')
}
