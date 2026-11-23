import { useEffect, useRef, useState } from 'react'
import { errorText } from './utils'

export function useResource<T>(load: (() => Promise<T>) | null) {
  const [data, setData] = useState<T>()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(load))
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (!load) {
      setData(undefined)
      setError('')
      setLoading(false)
      return
    }
    let current = true
    setLoading(true)
    setError('')
    load()
      .then(result => {
        if (current) setData(result)
      })
      .catch(cause => {
        if (current) {
          setData(undefined)
          setError(errorText(cause))
        }
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [load, revision])

  return { data, error, loading, reload: () => setRevision(value => value + 1) }
}

export function useAction() {
  const generation = useRef(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run<T>(operation: () => Promise<T>, onSuccess?: (result: T) => void) {
    const current = generation.current
    setBusy(true)
    setError('')
    try {
      const result = await operation()
      if (current === generation.current) onSuccess?.(result)
    } catch (cause) {
      if (current === generation.current) setError(errorText(cause))
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }

  function reset() {
    generation.current += 1
    setBusy(false)
    setError('')
  }

  return { busy, error, run, clear: () => setError(''), reset }
}
