import type { DashboardApi, Owner, Page } from '@/types/api'

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
export const SESSION_EXPIRED = 'my-court:session-expired'
let pendingRefresh: Promise<boolean> | undefined

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function refreshSession() {
  pendingRefresh ??= fetch(BASE_URL + '/auth/refresh', { method: 'POST', credentials: 'include' })
    .then(response => response.ok)
    .catch(() => false)
    .finally(() => { pendingRefresh = undefined })
  return pendingRefresh
}

async function request<T>(path: string, method = 'GET', body?: unknown, retry = true): Promise<T> {
  const isForm = body instanceof FormData
  let response: Response
  try {
    response = await fetch(BASE_URL + path, {
      method,
      credentials: 'include',
      headers: body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: isForm ? body : body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error('No pudimos conectar con la API. Comprueba que esté disponible e inténtalo otra vez.')
  }

  if (response.status === 401 && retry) {
    if (await refreshSession()) return request<T>(path, method, body, false)
    window.dispatchEvent(new Event(SESSION_EXPIRED))
    throw new ApiError(401, 'Tu sesión expiró. Vuelve a ingresar.')
  }

  const data = await response.json().catch(() => undefined)
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join('. ') : data?.message
    throw new ApiError(response.status, typeof message === 'string' ? message : 'La API no pudo completar la solicitud.')
  }
  if (data === undefined && response.status !== 204) {
    throw new Error('La API devolvió una respuesta inesperada. Revisa la configuración de conexión.')
  }
  return data as T
}

export const authApi = {
  login: (email: string, password: string) => request<{ user: Owner }>('/auth/login/owner', 'POST', { email, password }, false),
  logout: () => request('/auth/logout', 'POST', undefined, false),
}

const pageQuery = (page = 1) => '?page=' + page + '&limit=50'

export async function allPages<T>(loader: (page: number) => Promise<Page<T>>) {
  const first = await loader(1)
  const remaining = await Promise.all(Array.from({ length: first.pagination.totalPages - 1 }, (_, index) => loader(index + 2)))
  return [first, ...remaining].flatMap(page => page.data)
}

export const dashboardApi: DashboardApi = {
  getComplex: ownerId => request('/complexes/complex/' + ownerId),
  updateComplex: data => request('/complexes/update', 'PATCH', data),
  uploadImage: file => {
    const form = new FormData()
    form.append('file', file)
    return request('/complexes/add-image', 'PUT', form)
  },
  deleteImage: url => request('/complexes/delete-image', 'PATCH', { 'image-url': url }),
  fields: (id, page) => request('/fields/complex/' + id + pageQuery(page)),
  createField: data => request('/fields', 'POST', data),
  reservations: (id, page) => request('/reservations/' + id + pageQuery(page)),
  rating: id => request('/rating?' + new URLSearchParams({ ids: id })),
  tournaments: id => request('/tournaments/complex?' + new URLSearchParams({ id })),
  createTournament: data => request('/tournaments', 'POST', data),
  openTournament: (id, data) => request('/tournaments/open/' + id, 'PATCH', data),
  deleteTournament: id => request('/tournaments/delete/' + id, 'DELETE'),
  subscribers: id => request('/tournaments/subscribers/' + id),
  reviewSubscriber: (id, userId, action) => request('/tournaments/subscribers/' + id + '/' + userId, 'PATCH', { userId, action }),
  addApproved: id => request('/tournaments/add-approved-users/' + id, 'POST'),
  addPlayers: (id, players) => request('/tournaments/add-players/' + id, 'POST', { players }),
  teams: id => request('/tournaments/teams/' + id),
  addTeams: (id, teams) => request('/tournaments/add-teams/' + id, 'PATCH', { teams }),
  generateSchedule: id => request('/tournaments/generate-schedule/' + id, 'POST'),
  updateMatch: (id, data) => request('/tournaments/match/' + id, 'PATCH', data),
}
