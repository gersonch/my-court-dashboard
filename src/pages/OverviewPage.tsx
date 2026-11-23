import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  CalendarDays,
  ChevronRight,
  MapPin,
  PanelTop,
  Star,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { CourtArt } from '@/components/layout/DashboardLayout'
import {
  Badge,
  Button,
  Empty,
  InlineError,
  Loading,
  PageHeading,
  PanelTitle,
} from '@/components/ui'
import { dashboardApi } from '@/lib/api'
import { useResource } from '@/lib/resource'
import { durationLabel, formatDate, formatRating, formatTime, STATES } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useWorkspaceStore } from '@/stores/complexStore'
import type { Field } from '@/types/api'

export function OverviewPage() {
  const owner = useAuthStore(state => state.owner)
  const complex = useWorkspaceStore(state => state.complex)
  const fields = useWorkspaceStore(state => state.fields)
  const firstName = owner!.name.trim().split(/\s+/)[0]
  const venue = complex.data
  const venueId = venue?._id
  const courts = fields.data

  const loadTournaments = useCallback(() => dashboardApi.tournaments(venueId!), [venueId])
  const loadRating = useCallback(() => dashboardApi.rating(venueId!), [venueId])
  const loadBookings = useCallback(() => getBookingSummary(courts!), [courts])
  const tournaments = useResource(venueId ? loadTournaments : null)
  const rating = useResource(venueId ? loadRating : null)
  const bookings = useResource(courts ? loadBookings : null)
  const stars = rating.data?.[0]?.rating
  const upcoming = bookings.data?.upcoming ?? []
  const recent = tournaments.data?.slice(0, 4) ?? []
  const bookingError = fields.error || bookings.error
  const retryBookings = fields.error ? fields.reload : bookings.reload

  return (
    <div className="page">
      <PageHeading>
        <div>
          <h1>Resumen</h1>
          <p>Revisa la actividad de tu recinto en un solo lugar.</p>
        </div>
      </PageHeading>
      <section className="hero">
        <div className="hero-content">
          {venue?.name && (
            <span className="hero-location">
              <MapPin size={15} />
              {venue?.name}
            </span>
          )}
          <h2>Hola, {firstName}</h2>
          <p>Consulta tu agenda y organiza las canchas y torneos de tu recinto.</p>
          <Link className="button button--light" to="/dashboard/reservations">
            <CalendarDays size={17} /> Ver agenda
          </Link>
        </div>
        <CourtArt />
      </section>
      {complex.error && (
        <InlineError>
          <span>{complex.error}</span>
          <Button className="button--secondary" onClick={complex.reload}>
            Reintentar
          </Button>
        </InlineError>
      )}

      <div className="stats-grid">
        <StatCard
          Icon={PanelTop}
          label="Canchas"
          value={courts?.length}
          note="En tu recinto"
          href="/dashboard/fields"
        />
        <StatCard
          Icon={CalendarDays}
          label="Turnos en agenda"
          value={bookings.data?.total}
          note="Desde hoy · 7 días"
          href="/dashboard/reservations"
        />
        <StatCard
          Icon={Trophy}
          label="Torneos visibles"
          value={tournaments.data?.length}
          note="En el listado del recinto"
          href="/dashboard/tournaments"
        />
        <StatCard
          Icon={Star}
          label="Valoración"
          value={stars ? formatRating(stars) + ' / 5' : undefined}
          note="Promedio del recinto"
          href="/dashboard/complex"
        />
      </div>

      <div className="overview-grid">
        <section className="panel">
          <PanelTitle>
            <div>
              <h2>Próximos turnos</h2>
              <p>Próximas reservas de tus canchas</p>
            </div>
            <Link className="text-link" to="/dashboard/reservations">
              Ver agenda
            </Link>
          </PanelTitle>
          {bookingError && (
            <InlineError>
              <span>{bookingError}</span>
              <Button className="button--secondary" onClick={retryBookings}>
                Reintentar
              </Button>
            </InlineError>
          )}
          {bookings.loading && <Loading />}
          {upcoming.length > 0 && (
            <ul className="record-list">
              {upcoming.map(item => (
                <li key={item._id}>
                  <span className="record-icon">
                    <CalendarDays size={16} />
                  </span>
                  <div>
                    <strong>{item.fieldName}</strong>
                    <small>
                      {formatDate(item.startTime, true)} · {formatTime(item.startTime)}
                    </small>
                  </div>
                  <Badge>{durationLabel(item.duration)}</Badge>
                </li>
              ))}
            </ul>
          )}
          {upcoming.length === 0 && !bookings.loading && !bookings.error && (
            <Empty>
              <strong>Sin próximos turnos</strong>
            </Empty>
          )}
        </section>
        <section className="panel">
          <PanelTitle>
            <div>
              <h2>Torneos</h2>
              <p>Torneos registrados en tu recinto</p>
            </div>
            <Link className="text-link" to="/dashboard/tournaments">
              Gestionar
            </Link>
          </PanelTitle>
          {tournaments.error && (
            <InlineError>
              <span>{tournaments.error}</span>
              <Button className="button--secondary" onClick={tournaments.reload}>
                Reintentar
              </Button>
            </InlineError>
          )}
          {tournaments.loading && <Loading />}
          {recent.length > 0 && (
            <ul className="record-list">
              {recent.map(item => (
                <li key={item._id}>
                  <span className="record-icon">
                    <Trophy size={16} />
                  </span>
                  <div>
                    <strong>{item.name}</strong>
                  </div>
                  <Badge className={item.state === 'open' ? 'badge--success' : undefined}>
                    {STATES[item.state] ?? item.state}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          {recent.length === 0 && !tournaments.loading && !tournaments.error && (
            <Empty>
              <strong>Sin torneos disponibles</strong>
            </Empty>
          )}
        </section>
      </div>

      {rating.error && (
        <InlineError>
          <span>{rating.error}</span>
          <Button className="button--secondary" onClick={rating.reload}>
            Reintentar
          </Button>
        </InlineError>
      )}
      {!venue && !complex.loading && !complex.error && (
        <Link className="shortcut" to="/dashboard/complex">
          <Building2 size={17} /> Revisar mi recinto <ChevronRight size={17} />
        </Link>
      )}
    </div>
  )
}

async function getBookingSummary(fields: Field[]) {
  const results = await Promise.all(
    fields.map(async field => {
      const page = await dashboardApi.reservations(field._id)
      return {
        count: page.pagination.totalItems,
        entries: page.data.map(item => ({ ...item, fieldName: field.name })),
      }
    }),
  )

  const now = Date.now()
  const upcoming = results
    .flatMap(result => result.entries)
    .filter(item => Date.parse(item.startTime) >= now)
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
    .slice(0, 4)

  return { total: results.reduce((sum, result) => sum + result.count, 0), upcoming }
}

type StatCardProps = {
  Icon: LucideIcon
  label: string
  value?: number | string
  note: string
  href: string
}

function StatCard({ Icon, label, value, note, href }: StatCardProps) {
  return (
    <Link className="stat-card" to={href}>
      <span className="section-icon">
        <Icon size={19} />
      </span>
      <span className="stat-label">{label}</span>
      <strong>{value ?? '—'}</strong>
      <small>{note}</small>
    </Link>
  )
}
