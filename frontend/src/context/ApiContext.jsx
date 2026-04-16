import React, { createContext, useContext, useState, useCallback } from 'react'
import apiFetch from '../lib/api'

const ApiContext = createContext(null)

export function ApiProvider({ children }) {
  const [loadingCount, setLoadingCount] = useState(0)

  const beginLoading = useCallback(() => setLoadingCount(c => c + 1), [])
  const endLoading = useCallback(() => setLoadingCount(c => Math.max(0, c - 1)), [])

  // wrapper around apiFetch that toggles global loading
  // passe cfg.showLoader = false para chamadas silenciosas
  const request = useCallback(async (path, opts = {}, cfg = {}) => {
    const shouldShowLoader = cfg.showLoader !== false

    if (shouldShowLoader) beginLoading()
    try {
      const res = await apiFetch(path, opts, cfg)
      return res
    } finally {
      if (shouldShowLoader) endLoading()
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
