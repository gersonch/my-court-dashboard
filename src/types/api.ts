export type Sport = 'padel' | 'tenis' | 'futbol'
export type TournamentType = 'americano' | 'liga' | 'playoff'
export type TournamentState = 'inactive' | 'open' | 'in_progress' | 'finished' | 'cancelled'

export interface Owner {
  id: string
  name: string
  email: string
  role: 'owner'
}

export interface Complex {
  _id: string
  name: string
  description: string
  address: string
  city: string
  region: string
  country: string
  image_url: string[]
  sports: Sport[]
  equipment?: Partial<Record<Sport, boolean>>
  facilities?: Partial<Record<Facility, boolean>>
}

export type Facility = 'parking' | 'bar' | 'restaurant' | 'changingRooms' | 'showers'
export type ComplexUpdate = Pick<Complex, 'sports' | 'equipment' | 'facilities'>

export interface TimeBlock {
  dayOfWeek: number
  from: string
  to: string
  prices: { price: number; duration: string }[]
}

export interface FieldDraft {
  name: string
  type: Sport
  complexId: string
  availability: TimeBlock[]
}

export interface Field extends FieldDraft { _id: string }

export interface Reservation {
  _id: string
  fieldId: string
  startTime: string
  duration: string
}

export interface Page<T> {
  data: T[]
  pagination: { totalItems: number; totalPages: number; hasMore: boolean }
}

export interface Tournament {
  _id: string
  name: string
  state: TournamentState
  tournamentType?: TournamentType
  sport?: Sport
}

export interface TournamentDraft {
  name: string
  sport: Exclude<Sport, 'tenis'>
  tournamentType: TournamentType
  config: { teamsCount: number; rounds?: number; courtCount?: number; playoffsRounds?: number }
}

export interface TournamentDates {
  startDate: string
  endDate: string
  category: string
}

export interface Subscriber {
  userId: string
  userName: string
  userLastname?: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface Player { userId: string }
export interface Team { name: string; players: Player[] }

export interface Match {
  round: number
  courtNumber: number
  startTime?: string
  coupleA: string[]
  coupleB: string[]
  pointsA: number
  pointsB: number
  isFinished: boolean
}

export interface RankingRow {
  playerId: string
  playerName: string
  points: number
  gamesPlayed: number
}

export interface MatchResult {
  matchIndex: number
  pointsA: number
  pointsB: number
  isFinished: boolean
}

export interface DashboardApi {
  getComplex(ownerId: string): Promise<Complex>
  updateComplex(data: ComplexUpdate): Promise<unknown>
  uploadImage(file: File): Promise<unknown>
  deleteImage(url: string): Promise<unknown>
  fields(complexId: string, page?: number): Promise<Page<Field>>
  createField(data: FieldDraft): Promise<Field>
  reservations(fieldId: string, page?: number): Promise<Page<Reservation>>
  rating(complexId: string): Promise<{ complexId: string; rating: number }[]>
  tournaments(complexId: string): Promise<Tournament[]>
  createTournament(data: TournamentDraft): Promise<Tournament>
  openTournament(id: string, data: TournamentDates): Promise<Tournament>
  deleteTournament(id: string): Promise<unknown>
  subscribers(id: string): Promise<Subscriber[]>
  reviewSubscriber(id: string, userId: string, action: 'approve' | 'reject'): Promise<unknown>
  addApproved(id: string): Promise<unknown>
  addPlayers(id: string, players: Player[]): Promise<unknown>
  teams(id: string): Promise<Team[]>
  addTeams(id: string, teams: Team[]): Promise<unknown>
  generateSchedule(id: string): Promise<Match[]>
  updateMatch(id: string, data: MatchResult): Promise<{ match: Match; ranking: RankingRow[] }>
}
