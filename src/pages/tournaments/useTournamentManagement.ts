import { useCallback, useState, type SubmitEvent } from 'react'
import { ApiError, dashboardApi } from '@/lib/api'
import { useAction, useResource } from '@/lib/resource'
import type { Match, RankingRow, Team } from '@/types/api'
import { AMERICANO_COUNTS, parsePlayerIds } from './players'

export type ManagementMode = '' | 'americano' | 'teams'

export function useTournamentManagement(tournamentId: string | undefined, mode: ManagementMode) {
  const action = useAction()
  const [teamCount, setTeamCount] = useState(1)
  const [rosterReady, setRosterReady] = useState(false)
  const [schedule, setSchedule] = useState<Match[]>([])
  const [ranking, setRanking] = useState<RankingRow[]>([])
  const [notice, setNotice] = useState('')

  const loadTeams = useCallback(async () => {
    try {
      return await dashboardApi.teams(tournamentId!)
    } catch (cause) {
      if (cause instanceof ApiError && cause.message === 'No teams found for this tournament')
        return []
      throw cause
    }
  }, [tournamentId])
  const loadSubscribers = useCallback(() => dashboardApi.subscribers(tournamentId!), [tournamentId])
  const teams = useResource(tournamentId && mode === 'teams' ? loadTeams : null)
  const subscribers = useResource(tournamentId && mode === 'americano' ? loadSubscribers : null)
  const players = subscribers.data ?? []

  function resetManagement() {
    action.reset()
    setTeamCount(1)
    setRosterReady(false)
    setSchedule([])
    setRanking([])
    setNotice('')
  }

  function saveTeams(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const entries: Team[] = Array.from({ length: teamCount }, (_, index) => ({
      name: String(form.get('name-' + index)).trim(),
      players: parsePlayerIds(String(form.get('ids-' + index))),
    }))
    void action.run(() => dashboardApi.addTeams(tournamentId!, entries), teams.reload)
  }

  function reviewSubscriber(userId: string, decision: 'approve' | 'reject') {
    void action.run(
      () => dashboardApi.reviewSubscriber(tournamentId!, userId, decision),
      subscribers.reload,
    )
  }

  function rosterSaved(message: string) {
    setRosterReady(true)
    setNotice(message)
  }

  function addApproved() {
    void action.run(
      () => dashboardApi.addApproved(tournamentId!),
      () => rosterSaved('Inscritos aprobados agregados al torneo.'),
    )
  }

  function savePlayers(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const entries = parsePlayerIds(String(new FormData(event.currentTarget).get('ids')))
    void action.run(
      () => {
        if (!AMERICANO_COUNTS.includes(entries.length)) {
          throw new Error('Ingresa 4, 6 u 8 identificadores distintos.')
        }
        return dashboardApi.addPlayers(tournamentId!, entries)
      },
      () => rosterSaved('Jugadores guardados.'),
    )
  }

  function generateSchedule() {
    void action.run(
      () => dashboardApi.generateSchedule(tournamentId!),
      matches => {
        setSchedule(matches)
        setNotice('Fixture generado.')
      },
    )
  }

  function saveScore(event: SubmitEvent<HTMLFormElement>, matchIndex: number) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const score = {
      matchIndex,
      pointsA: Number(form.get('pointsA')),
      pointsB: Number(form.get('pointsB')),
      isFinished: true,
    }
    void action.run(
      () => dashboardApi.updateMatch(tournamentId!, score),
      result => {
        setSchedule(matches =>
          matches.map((match, index) => (index === matchIndex ? result.match : match)),
        )
        setRanking(result.ranking)
        setNotice('Resultado guardado.')
      },
    )
  }

  return {
    action,
    teams,
    subscribers,
    players,
    teamCount,
    rosterReady,
    schedule,
    ranking,
    notice,
    resetManagement,
    saveTeams,
    reviewSubscriber,
    addApproved,
    savePlayers,
    generateSchedule,
    saveScore,
    addTeam: () => setTeamCount(count => count + 1),
    playerName: (userId: string) =>
      players.find(player => player.userId === userId)?.userName ?? userId,
  }
}
