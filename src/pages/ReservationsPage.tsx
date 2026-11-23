import { useCallback, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import {
  Badge,
  Button,
  Empty,
  FormField,
  InlineError,
  Loading,
  PageHeading,
  PanelTitle,
} from '@/components/ui'
import { allPages, dashboardApi } from '@/lib/api'
import { useResource } from '@/lib/resource'
import { dateKey, durationLabel, formatDate, formatTime } from '@/lib/utils'
import { useWorkspaceStore } from '@/stores/complexStore'

export function ReservationsPage() {
  const complex = useWorkspaceStore(state => state.complex)
  const fields = useWorkspaceStore(state => state.fields)
  const [selectedField, setSelectedField] = useState('')
  const courts = fields.data ?? []
  const selectedId = courts.some(field => field._id === selectedField)
    ? selectedField
    : courts[0]?._id

  const [selectedDay, setSelectedDay] = useState('')
  const loadReservations = useCallback(
    async () => ({
      fieldId: selectedId,
      entries: await allPages(page => dashboardApi.reservations(selectedId!, page)),
    }),
    [selectedId],
  )
  const reservations = useResource(selectedId ? loadReservations : null)
  const loadedEntries =
    reservations.data?.fieldId === selectedId ? reservations.data?.entries : undefined
  const entries = loadedEntries ?? []
  const days = new Map(entries.map(item => [dateKey(item.startTime), item.startTime]))
  const visible = selectedDay
    ? entries.filter(item => dateKey(item.startTime) === selectedDay)
    : entries
  const countLabel = visible.length === 1 ? '1 turno' : visible.length + ' turnos'
  const error = complex.error || fields.error

  return (
    <div className="page">
      <PageHeading>
        <div>
          <h1>Agenda</h1>
          <p>Consulta los turnos de tus canchas para los próximos días.</p>
        </div>
        <Badge>Solo consulta</Badge>
      </PageHeading>
      {error && (
        <InlineError>
          <span>{error}</span>
          <Button
            className="button--secondary"
            onClick={complex.error ? complex.reload : fields.reload}
          >
            Reintentar
          </Button>
        </InlineError>
      )}
      {(complex.loading || fields.loading) && !fields.data && <Loading />}
      {selectedId && (
        <>
          <div className="toolbar">
            <FormField>
              <span>Cancha</span>
              <select
                value={selectedId}
                onChange={event => {
                  setSelectedField(event.target.value)
                  setSelectedDay('')
                }}
              >
                {courts.map(court => (
                  <option key={court._id} value={court._id}>
                    {court.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <section className="panel">
            <PanelTitle>
              <div>
                <h2>Turnos de la cancha</h2>
                <p>Desde hoy y hasta siete días después</p>
              </div>
              <Badge>{countLabel}</Badge>
            </PanelTitle>
            {reservations.error && (
              <InlineError>
                <span>{reservations.error}</span>
                <Button className="button--secondary" onClick={reservations.reload}>
                  Reintentar
                </Button>
              </InlineError>
            )}
            {!loadedEntries && !reservations.error && <Loading />}
            {days.size > 1 && (
              <div className="date-filters" aria-label="Filtrar por fecha">
                <button
                  type="button"
                  className="filter-chip"
                  aria-pressed={!selectedDay}
                  onClick={() => setSelectedDay('')}
                >
                  Todos
                </button>
                {Array.from(days, ([key, date]) => (
                  <button
                    key={key}
                    type="button"
                    className="filter-chip"
                    aria-pressed={key === selectedDay}
                    onClick={() => setSelectedDay(key)}
                  >
                    {formatDate(date, true)}
                  </button>
                ))}
              </div>
            )}
            {loadedEntries &&
              (visible.length ? (
                <ul className="record-list agenda-list">
                  {visible.map((item, index) => (
                    <li key={item._id}>
                      <span className="record-icon">
                        <CalendarDays size={18} />
                      </span>
                      <div>
                        <strong>{formatTime(item.startTime)}</strong>
                        <small>{formatDate(item.startTime)}</small>
                      </div>
                      <Badge>{durationLabel(item.duration)}</Badge>
                      <span className="sr-only">Turno {index + 1}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>
                  <strong>No hay turnos en este período</strong>
                </Empty>
              ))}
          </section>
        </>
      )}
      {fields.data && courts.length === 0 && (
        <section className="panel">
          <Empty>
            <strong>Sin canchas para consultar</strong>
            <p>Crea una cancha para ver sus turnos en la agenda.</p>
          </Empty>
        </section>
      )}
    </div>
  )
}
