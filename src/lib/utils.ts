import type { Facility, Sport, TournamentState, TournamentType } from '@/types/api'

export const SPORTS: Record<Sport, string> = { padel: 'Pádel', tenis: 'Tenis', futbol: 'Fútbol' }
export const FACILITIES: Record<Facility, string> = {
  parking: 'Estacionamiento', bar: 'Bar', restaurant: 'Restaurante',
  changingRooms: 'Camarines', showers: 'Duchas',
}
export const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const FORMATS: Record<TournamentType, string> = { americano: 'Americano', liga: 'Liga', playoff: 'Playoff' }
export const STATES: Record<TournamentState, string> = {
  inactive: 'Borrador', open: 'Abierto', in_progress: 'En curso', finished: 'Finalizado', cancelled: 'Cancelado',
}

const zone = import.meta.env.VITE_TIME_ZONE || 'America/Santiago'
const locale = 'es-CL'
const fullDate = new Intl.DateTimeFormat(locale, { timeZone: zone, weekday: 'long', month: 'long', day: 'numeric' })
const shortDate = new Intl.DateTimeFormat(locale, { timeZone: zone, month: 'short', day: 'numeric' })
const time = new Intl.DateTimeFormat(locale, { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' })
const money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'CLP' })

export const formatDate = (value: Date | string, compact = false) => (compact ? shortDate : fullDate).format(new Date(value))
export const formatTime = (value: Date | string) => time.format(new Date(value))
export const dateKey = (value: Date | string) => dayKey.format(new Date(value))
export const formatPrice = (value: number) => money.format(value)
export const formatRating = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 1 })
export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
export const errorText = (error: unknown) => error instanceof Error ? error.message : 'Ocurrió un error inesperado.'

export function durationLabel(duration: string) {
  const [hours, minutes] = duration.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return duration
  return hours * 60 + minutes + ' min'
}
