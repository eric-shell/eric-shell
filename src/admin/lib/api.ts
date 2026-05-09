import { toast } from '../../components/ui'

export interface ApiCallOptions {
  errorMessage?: string
  onUnauthorized?: () => void
}

export async function apiCall<T = unknown>(
  url: string,
  init?: RequestInit,
  options: ApiCallOptions = {},
): Promise<T | null> {
  const { errorMessage = 'Request failed.', onUnauthorized } = options
  try {
    const res = await fetch(url, init)
    if (res.status === 401) {
      if (onUnauthorized) onUnauthorized()
      else toast.error(errorMessage)
      return null
    }
    if (!res.ok) {
      const data = await res.json().catch(() => null) as { error?: string } | null
      toast.error(data?.error || errorMessage)
      return null
    }
    if (res.status === 204) return null
    return await res.json() as T
  } catch {
    toast.error('Network error.')
    return null
  }
}
