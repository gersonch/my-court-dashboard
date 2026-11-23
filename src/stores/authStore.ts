import { create } from 'zustand'
import { authApi, SESSION_EXPIRED } from '@/lib/api'
import type { Owner } from '@/types/api'

type AuthState = {
  owner: Owner | null
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
}

const STORAGE_KEY = 'my-court:owner'
const LEGACY_STORAGE_KEY = 'my-court:owner-session'

function readOwner(): Owner | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      const owner = JSON.parse(saved) as Owner | null
      return owner?.role === 'owner' ? owner : null
    }

    const previous = JSON.parse(sessionStorage.getItem(LEGACY_STORAGE_KEY) ?? 'null') as {
      owner?: Owner
      mode?: string
    } | null
    return previous?.mode === 'live' && previous.owner?.role === 'owner' ? previous.owner : null
  } catch {
    return null
  }
}

function saveOwner(owner: Owner | null) {
  try {
    if (owner) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(owner))
    else sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // The session remains available in memory when storage is blocked.
  }
}

export const useAuthStore = create<AuthState>(set => ({
  owner: readOwner(),
  login: async (email, password) => {
    const { user } = await authApi.login(email, password)
    if (user.role !== 'owner') throw new Error('Utiliza una cuenta de propietario.')
    set({ owner: user })
  },
  logout: async () => {
    await authApi.logout()
    set({ owner: null })
  },
}))

saveOwner(useAuthStore.getState().owner)
const unsubscribe = useAuthStore.subscribe(({ owner }) => saveOwner(owner))
const expire = () => useAuthStore.setState({ owner: null })
window.addEventListener(SESSION_EXPIRED, expire)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unsubscribe()
    window.removeEventListener(SESSION_EXPIRED, expire)
  })
}
