import { create } from 'zustand'
import { allPages, dashboardApi } from '@/lib/api'
import { errorText } from '@/lib/utils'
import type { Complex, Field } from '@/types/api'
import { useAuthStore } from './authStore'

type Resource<T> = {
  data?: T
  error: string
  loading: boolean
  reload(): Promise<void>
}

type WorkspaceState = {
  ownerId?: string
  complex: Resource<Complex>
  fields: Resource<Field[]>
  setOwner(ownerId?: string): void
}

const empty = <T>(reload: Resource<T>['reload']): Resource<T> => ({ error: '', loading: false, reload })

export const useWorkspaceStore = create<WorkspaceState>((set, get) => {
  async function loadComplex() {
    const { ownerId, complex } = get()
    if (!ownerId) return

    const pending = { ...complex, loading: true, error: '' }
    set({ complex: pending })
    try {
      const data = await dashboardApi.getComplex(ownerId)
      if (get().complex !== pending) return

      const venueChanged = complex.data?._id !== data._id
      set({
        complex: { ...pending, data, loading: false },
        fields: venueChanged ? emptyFields : get().fields,
      })
      if (venueChanged) void loadFields()
    } catch (cause) {
      if (get().complex !== pending) return
      set({ complex: { ...emptyComplex, error: errorText(cause) }, fields: emptyFields })
    }
  }

  async function loadFields() {
    const { complex, fields } = get()
    const complexId = complex.data?._id
    if (!complexId) return

    const pending = { ...fields, loading: true, error: '' }
    set({ fields: pending })
    try {
      const data = await allPages(page => dashboardApi.fields(complexId, page))
      if (get().fields === pending) set({ fields: { ...pending, data, loading: false } })
    } catch (cause) {
      if (get().fields === pending) set({ fields: { ...emptyFields, error: errorText(cause) } })
    }
  }

  const emptyComplex = empty<Complex>(loadComplex)
  const emptyFields = empty<Field[]>(loadFields)

  return {
    complex: emptyComplex,
    fields: emptyFields,
    setOwner(ownerId) {
      if (get().ownerId === ownerId) return
      set({ ownerId, complex: emptyComplex, fields: emptyFields })
      if (ownerId) void loadComplex()
    },
  }
})

const setWorkspaceOwner = useWorkspaceStore.getState().setOwner
const unsubscribe = useAuthStore.subscribe(({ owner }) => setWorkspaceOwner(owner?.id))
setWorkspaceOwner(useAuthStore.getState().owner?.id)
if (import.meta.hot) import.meta.hot.dispose(unsubscribe)
