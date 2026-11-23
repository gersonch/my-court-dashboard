import { useCallback, useState, type SubmitEvent } from 'react'
import { Plus, Trophy, Users } from 'lucide-react'
import {
  Badge,
  Button,
  Empty,
  FormField,
  InlineError,
  Loading,
  Modal,
  ModalActions,
  ModalTitle,
  PageHeading,
  PanelTitle,
} from '@/components/ui'
import { dashboardApi } from '@/lib/api'
import { useAction, useResource } from '@/lib/resource'
import { FORMATS, SPORTS, STATES } from '@/lib/utils'
import { useWorkspaceStore } from '@/stores/complexStore'
import type { Tournament, TournamentDraft, TournamentType } from '@/types/api'
import { AMERICANO_COUNTS } from './tournaments/players'
import { useTournamentManagement, type ManagementMode } from './tournaments/useTournamentManagement'

const DIVISIONS = [
  'Primera división',
  'Segunda división',
  'Tercera división',
  'Cuarta división',
  'Quinta división',
]
const PLAYOFF_COUNTS = [4, 8, 16]

const SUBSCRIPTION_STATUS = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' }

type TournamentAction = 'open' | 'delete' | 'manage'
type TournamentDialog = { kind: 'create' } | { kind: TournamentAction; tournament: Tournament }

export function TournamentsPage() {
  const complex = useWorkspaceStore(state => state.complex)
  const [dialog, setDialog] = useState<TournamentDialog>()
  const [knownTournaments, setKnownTournaments] = useState<Record<string, Tournament>>({})
  const complexId = complex.data?._id
  const loadTournaments = useCallback(() => dashboardApi.tournaments(complexId!), [complexId])
  const tournaments = useResource(complexId ? loadTournaments : null)
  const items = tournaments.data ?? []
  const closeDialog = () => setDialog(undefined)

  const [format, setFormat] = useState<TournamentType>('americano')
  const [startDate, setStartDate] = useState('')
  const [managementMode, setManagementMode] = useState<ManagementMode>('')
  const dialogAction = useAction()
  const managementState = useTournamentManagement(
    dialog?.kind === 'manage' ? dialog.tournament._id : undefined,
    managementMode,
  )
  const { teams, subscribers, players, teamCount, rosterReady, schedule, notice } = managementState
  const approvedCount = players.filter(player => player.status === 'approved').length
  const hasSchedule = schedule.length > 0
  const standings = [...managementState.ranking].sort((a, b) => b.points - a.points)
  const teamsError = teams.error || managementState.action.error
  const subscribersError = subscribers.error || managementState.action.error

  let dialogTitle = ''
  switch (dialog?.kind) {
    case 'create':
      dialogTitle = 'Nuevo torneo'
      break
    case 'open':
      dialogTitle = 'Abrir ' + dialog.tournament.name
      break
    case 'delete':
      dialogTitle = 'Eliminar torneo'
      break
    case 'manage':
      dialogTitle = dialog.tournament.name
      break
  }

  function changeManagementMode(mode: ManagementMode) {
    managementState.resetManagement()
    setManagementMode(mode)
  }

  function showDialog(next: TournamentDialog) {
    dialogAction.reset()
    setFormat('americano')
    setStartDate('')
    const type = next.kind === 'manage' ? next.tournament.tournamentType : undefined
    changeManagementMode(type === 'americano' ? 'americano' : type ? 'teams' : '')
    setDialog(next)
  }

  function rememberTournament(tournament: Tournament) {
    setKnownTournaments(previous => ({
      ...previous,
      [tournament._id]: { ...previous[tournament._id], ...tournament },
    }))
    tournaments.reload()
  }

  function createTournament(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name')).trim()
    if (!name) return

    const teamsCount = Number(form.get('teamsCount'))
    const config: TournamentDraft['config'] = { teamsCount }
    if (format === 'americano') {
      config.rounds = Number(form.get('rounds'))
      config.courtCount = Number(form.get('courtCount'))
    }
    if (format === 'playoff') config.playoffsRounds = Math.log2(teamsCount) - 1

    const sport = form.get('sport') as TournamentDraft['sport']
    void dialogAction.run(async () => {
      const created = await dashboardApi.createTournament({
        name,
        sport,
        tournamentType: format,
        config,
      })
      rememberTournament(created)
    }, closeDialog)
  }

  function openTournament(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (dialog?.kind !== 'open') return
    const form = new FormData(event.currentTarget)
    const dates = {
      startDate: new Date(String(form.get('startDate'))).toISOString(),
      endDate: new Date(String(form.get('endDate'))).toISOString(),
      category: String(form.get('category')),
    }
    void dialogAction.run(async () => {
      const updated = await dashboardApi.openTournament(dialog.tournament._id, dates)
      if (updated) rememberTournament(updated)
    }, closeDialog)
  }

  function deleteTournament() {
    if (dialog?.kind !== 'delete') return
    void dialogAction.run(async () => {
      await dashboardApi.deleteTournament(dialog.tournament._id)
      tournaments.reload()
    }, closeDialog)
  }

  const error = complex.error || tournaments.error

  return (
    <div className="page">
      <PageHeading>
        <div>
          <h1>Torneos</h1>
          <p>Organiza las competencias y gestiona a sus participantes.</p>
        </div>
        {complexId && (
          <Button onClick={() => showDialog({ kind: 'create' })}>
            <Plus size={18} /> Nuevo torneo
          </Button>
        )}
      </PageHeading>
      {error && (
        <InlineError>
          <span>{error}</span>
          <Button
            className="button--secondary"
            onClick={complex.error ? complex.reload : tournaments.reload}
          >
            Reintentar
          </Button>
        </InlineError>
      )}
      {(complex.loading || tournaments.loading) && !tournaments.data && <Loading />}

      {items.length > 0 && (
        <div className="cards-grid">
          {items.map(item => {
            const tournament = { ...knownTournaments[item._id], ...item }
            const { name, state, tournamentType, sport } = tournament
            const isOpen = state === 'open'
            const canManage = isOpen || state === 'in_progress'
            return (
              <article className="panel tournament-card" key={tournament._id}>
                <div className="court-card-heading">
                  <span className="section-icon">
                    <Trophy size={20} />
                  </span>
                  <div>
                    <h2>{name}</h2>
                    <div className="chips">
                      <Badge className={isOpen ? 'badge--success' : undefined}>
                        {STATES[state] ?? state}
                      </Badge>
                      {tournamentType && <Badge>{FORMATS[tournamentType]}</Badge>}
                      {sport && <Badge>{SPORTS[sport]}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="row-actions">
                  {state === 'inactive' && (
                    <>
                      <Button
                        className="button--secondary"
                        onClick={() => showDialog({ kind: 'open', tournament })}
                      >
                        Abrir torneo
                      </Button>
                      <Button
                        className="button--quiet"
                        onClick={() => showDialog({ kind: 'delete', tournament })}
                      >
                        Eliminar
                      </Button>
                    </>
                  )}
                  {canManage && (
                    <Button
                      className="button--secondary"
                      onClick={() => showDialog({ kind: 'manage', tournament })}
                    >
                      Gestionar torneo
                    </Button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
      {tournaments.data && items.length === 0 && (
        <section className="panel">
          <Empty>
            <strong>Aún no tienes torneos</strong>
            <p>Crea un torneo para empezar a organizar las inscripciones.</p>
          </Empty>
        </section>
      )}

      {dialog && (
        <Modal aria-label={dialogTitle} onClose={closeDialog}>
          <ModalTitle>{dialogTitle}</ModalTitle>
          {dialog.kind === 'create' && (
            <form className="form-stack" onSubmit={createTournament}>
              <FormField>
                <span>Nombre</span>
                <input name="name" required placeholder="Ej. Americano de primavera" />
              </FormField>
              <div className="form-grid">
                <FormField>
                  <span>Formato</span>
                  <select
                    value={format}
                    onChange={event => setFormat(event.target.value as TournamentType)}
                  >
                    {Object.entries(FORMATS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField>
                  <span>Deporte</span>
                  <select key={format} name="sport">
                    <option value="padel">Pádel</option>
                    {format !== 'americano' && <option value="futbol">Fútbol</option>}
                  </select>
                </FormField>
              </div>

              {format === 'americano' && (
                <div className="form-grid form-grid--three">
                  <CountSelect label="Jugadores" options={AMERICANO_COUNTS} />
                  <FormField>
                    <span>Rondas</span>
                    <input name="rounds" type="number" min="1" defaultValue="3" required />
                  </FormField>
                  <FormField>
                    <span>Canchas</span>
                    <input name="courtCount" type="number" min="1" defaultValue="1" required />
                  </FormField>
                </div>
              )}
              {format === 'playoff' && <CountSelect label="Equipos" options={PLAYOFF_COUNTS} />}
              {format === 'liga' && (
                <FormField>
                  <span>Equipos</span>
                  <input name="teamsCount" type="number" min="4" defaultValue="4" required />
                </FormField>
              )}

              <InlineError>{dialogAction.error}</InlineError>
              <ModalActions>
                <Button type="submit" disabled={dialogAction.busy}>
                  {dialogAction.busy ? 'Creando…' : 'Crear torneo'}
                </Button>
              </ModalActions>
            </form>
          )}
          {dialog.kind === 'open' && (
            <form onSubmit={openTournament} className="form-stack">
              <FormField>
                <span>Categoría</span>
                <select name="category">
                  {DIVISIONS.map(division => (
                    <option key={division}>{division}</option>
                  ))}
                </select>
              </FormField>
              <div className="form-grid">
                <FormField>
                  <span>Fecha de inicio</span>
                  <input
                    type="date"
                    name="startDate"
                    onChange={event => setStartDate(event.target.value)}
                    required
                  />
                </FormField>
                <FormField>
                  <span>Fecha de término</span>
                  <input type="date" name="endDate" min={startDate || undefined} required />
                </FormField>
              </div>
              <InlineError>{dialogAction.error}</InlineError>
              <ModalActions>
                <Button type="submit" disabled={dialogAction.busy}>
                  {dialogAction.busy ? 'Abriendo…' : 'Abrir torneo'}
                </Button>
              </ModalActions>
            </form>
          )}
          {dialog.kind === 'delete' && (
            <>
              <p>
                Se eliminará el borrador de <strong>{dialog.tournament.name}</strong>.
              </p>
              <InlineError>{dialogAction.error}</InlineError>
              <ModalActions>
                <Button
                  className="button--danger"
                  disabled={dialogAction.busy}
                  onClick={deleteTournament}
                >
                  Eliminar torneo
                </Button>
              </ModalActions>
            </>
          )}
          {dialog.kind === 'manage' && (
            <div className="form-stack">
              {!dialog.tournament.tournamentType && (
                <FormField>
                  <span>Formato del torneo</span>
                  <select
                    value={managementMode}
                    onChange={event => changeManagementMode(event.target.value as ManagementMode)}
                  >
                    <option value="">Selecciona un formato</option>
                    <option value="americano">Americano</option>
                    <option value="teams">Liga o Playoff</option>
                  </select>
                  <small>El listado de la API no incluye el formato.</small>
                </FormField>
              )}
              {managementMode === 'teams' && (
                <div className="form-stack">
                  {teamsError && (
                    <InlineError>
                      <span>{teamsError}</span>
                      {teams.error && (
                        <Button className="button--secondary" onClick={teams.reload}>
                          Reintentar
                        </Button>
                      )}
                    </InlineError>
                  )}
                  {teams.loading && <Loading />}
                  {teams.data &&
                    (teams.data.length ? (
                      <ul className="record-list">
                        {teams.data.map((team, index) => (
                          <li key={index}>
                            <span className="record-icon">
                              <Users size={17} />
                            </span>
                            <div>
                              <strong>{team.name}</strong>
                              <small>{team.players.length} jugadores</small>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Empty>
                        <strong>Sin equipos inscritos</strong>
                      </Empty>
                    ))}

                  {dialog.tournament.state === 'open' && (
                    <form className="form-stack" onSubmit={managementState.saveTeams}>
                      {Array.from({ length: teamCount }, (_, index) => (
                        <fieldset className="form-stack" key={index}>
                          <legend>Equipo {index + 1}</legend>
                          <FormField>
                            <span>Nombre del equipo</span>
                            <input name={'name-' + index} required />
                          </FormField>
                          <FormField>
                            <span>ID de jugadores</span>
                            <textarea name={'ids-' + index} rows={2} required />
                            <small>Separa los identificadores con comas o espacios.</small>
                          </FormField>
                        </fieldset>
                      ))}
                      <div className="form-actions form-actions--between">
                        <Button className="button--secondary" onClick={managementState.addTeam}>
                          Añadir equipo
                        </Button>
                        <Button type="submit" disabled={managementState.action.busy}>
                          Guardar equipos
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}
              {managementMode === 'americano' && (
                <div className="form-stack">
                  <PanelTitle>
                    <div>
                      <h2>Inscripciones</h2>
                      <p>Aprueba o rechaza las solicitudes de jugadores.</p>
                    </div>
                  </PanelTitle>
                  {subscribersError && (
                    <InlineError>
                      <span>{subscribersError}</span>
                      {subscribers.error && (
                        <Button className="button--secondary" onClick={subscribers.reload}>
                          Reintentar
                        </Button>
                      )}
                    </InlineError>
                  )}
                  {notice && (
                    <p className="notice" role="status">
                      {notice}
                    </p>
                  )}
                  {subscribers.loading && <Loading />}
                  {subscribers.data &&
                    (players.length ? (
                      <ul className="record-list">
                        {players.map(({ userId, userName, userLastname, status }) => (
                          <li className="subscriber-record" key={userId}>
                            <div>
                              <strong>{[userName, userLastname].filter(Boolean).join(' ')}</strong>
                              <small>{SUBSCRIPTION_STATUS[status]}</small>
                            </div>
                            <div className="row-actions">
                              {status !== 'approved' && (
                                <Button
                                  className="button--secondary"
                                  disabled={managementState.action.busy}
                                  onClick={() =>
                                    managementState.reviewSubscriber(userId, 'approve')
                                  }
                                >
                                  Aprobar
                                </Button>
                              )}
                              {status !== 'rejected' && (
                                <Button
                                  className="button--quiet"
                                  disabled={managementState.action.busy}
                                  onClick={() => managementState.reviewSubscriber(userId, 'reject')}
                                >
                                  Rechazar
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Empty>
                        <strong>Aún no hay inscripciones</strong>
                      </Empty>
                    ))}

                  {!hasSchedule && (
                    <>
                      <Button
                        className="button--secondary"
                        disabled={
                          managementState.action.busy || !AMERICANO_COUNTS.includes(approvedCount)
                        }
                        onClick={managementState.addApproved}
                      >
                        Agregar {approvedCount} aprobados
                      </Button>
                      <details className="manual-players">
                        <summary>Ingresar jugadores por ID</summary>
                        <form className="form-stack" onSubmit={managementState.savePlayers}>
                          <FormField>
                            <span>ID de jugadores</span>
                            <textarea name="ids" rows={3} required />
                            <small>Ingresa 4, 6 u 8 ID separados por comas o espacios.</small>
                          </FormField>
                          <Button
                            className="button--secondary"
                            type="submit"
                            disabled={managementState.action.busy}
                          >
                            Guardar jugadores
                          </Button>
                        </form>
                      </details>
                    </>
                  )}
                  {!hasSchedule && rosterReady && (
                    <div className="form-stack">
                      <p className="muted">
                        Generar el fixture reemplaza el calendario anterior. La API permite al
                        propietario trabajar con el fixture devuelto al generarlo.
                      </p>
                      <Button
                        disabled={managementState.action.busy}
                        onClick={managementState.generateSchedule}
                      >
                        Generar fixture
                      </Button>
                    </div>
                  )}

                  <>
                    {schedule.length > 0 && (
                      <>
                        <PanelTitle>
                          <div>
                            <h2>Fixture</h2>
                            <p>Registra el marcador final de cada partido.</p>
                          </div>
                        </PanelTitle>
                        {schedule.map((match, index) => (
                          <form
                            className="match-form"
                            key={index}
                            onSubmit={event => managementState.saveScore(event, index)}
                          >
                            <div>
                              <strong>
                                Ronda {match.round} · Cancha {match.courtNumber}
                              </strong>
                              <small>
                                {match.coupleA.map(managementState.playerName).join(' / ')} vs.{' '}
                                {match.coupleB.map(managementState.playerName).join(' / ')}
                              </small>
                            </div>
                            {match.isFinished ? (
                              <Badge className="badge--success">
                                {match.pointsA} – {match.pointsB}
                              </Badge>
                            ) : (
                              <div className="match-score">
                                <input
                                  aria-label={'Puntos de pareja A, partido ' + (index + 1)}
                                  type="number"
                                  min="0"
                                  name="pointsA"
                                  defaultValue={match.pointsA ?? 0}
                                  required
                                />
                                <span>–</span>
                                <input
                                  aria-label={'Puntos de pareja B, partido ' + (index + 1)}
                                  type="number"
                                  min="0"
                                  name="pointsB"
                                  defaultValue={match.pointsB ?? 0}
                                  required
                                />
                                <Button
                                  className="button--secondary"
                                  type="submit"
                                  disabled={managementState.action.busy}
                                >
                                  Registrar
                                </Button>
                              </div>
                            )}
                          </form>
                        ))}
                      </>
                    )}
                    {standings.length > 0 && (
                      <>
                        <PanelTitle>
                          <div>
                            <h2>Clasificación del torneo</h2>
                          </div>
                        </PanelTitle>
                        <ul className="record-list">
                          {standings.map(player => (
                            <li key={player.playerId}>
                              <div>
                                <strong>{player.playerName}</strong>
                                <small>{player.gamesPlayed} partidos</small>
                              </div>
                              <Badge className="badge--accent">{player.points} pts</Badge>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

function CountSelect({ label, options }: { label: string; options: number[] }) {
  return (
    <FormField>
      <span>{label}</span>
      <select name="teamsCount">
        {options.map(value => (
          <option key={value}>{value}</option>
        ))}
      </select>
    </FormField>
  )
}
