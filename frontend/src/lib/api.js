const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms))
}

export async function apiFetch(path, opts = {}, config = {}) {
  const url = path.startsWith('http') ? path : `${API}${path.startsWith('/') ? '' : '/'}${path}`
  const retries = config.retries ?? 3
  const baseDelay = config.retryDelay ?? 1200
  const retryOnNetworkError = config.retryOnNetworkError ?? true

  // Inject Authorization header from stored token
  const token = localStorage.getItem('auth_token')
  opts = {
    ...opts,
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  }

  let attempt = 0
  let lastErr
  while (attempt <= retries) {
    try {
      const controller = new AbortController()
      if (opts.signal) {
        opts.signal = opts.signal
      } else {
        opts.signal = controller.signal
      }

      const res = await fetch(url, opts)

      // 401 → clear token and redirect to login immediately (no retry)
      if (res.status === 401) {
        localStorage.removeItem('auth_token')
        window.location.href = '/login'
        const err = new Error('Não autorizado')
        err.noRetry = true
        throw err
      }

      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`)
        // For HTTP errors we still retry (cold start may respond 502/524)
        throw lastErr
      }
      return res
    } catch (err) {
      lastErr = err
      if (err.noRetry) break  // don't retry auth errors
      attempt++
      if (attempt > retries) break
      // only retry for network errors or explicit config
      if (!retryOnNetworkError && err.name !== 'TypeError') break
      const delay = baseDelay * Math.pow(1.6, attempt - 1)
      await sleep(delay)
    }
  }
  throw lastErr
}

export default apiFetch
