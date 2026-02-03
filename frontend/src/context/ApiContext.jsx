import React, { createContext, useContext, useState, useCallback } from 'react'
import apiFetch from '../lib/api'

const ApiContext = createContext(null)

export function ApiProvider({ children }) {
  const [loadingCount, setLoadingCount] = useState(0)

  const beginLoading = useCallback(() => setLoadingCount(c => c + 1), [])
  const endLoading = useCallback(() => setLoadingCount(c => Math.max(0, c - 1)), [])

  // wrapper around apiFetch that toggles global loading
  const request = useCallback(async (path, opts = {}, cfg = {}) => {
    beginLoading()
    try {
      const res = await apiFetch(path, opts, cfg)
      return res
    } finally {
      endLoading()
    }
  }, [beginLoading, endLoading])

  return (
    <ApiContext.Provider value={{ request, loading: loadingCount > 0 }}>
      {children}
    </ApiContext.Provider>
  )
}

export function useApi() {
  return useContext(ApiContext)
}
