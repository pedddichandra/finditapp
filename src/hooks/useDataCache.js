import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook for caching data fetches
 * Prevents unnecessary API calls if data is fresh
 * @param {Function} fetchFunction - The async function to fetch data
 * @param {number} cacheTime - How long to cache data in milliseconds (default: 30 seconds)
 */
export const useCachedData = (fetchFunction, cacheTime = 30000) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const lastFetchTime = useRef(0)
  const cachedData = useRef(null)

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now()
    
    // Return cached data if still fresh and not forcing refresh
    if (!force && cachedData.current && (now - lastFetchTime.current) < cacheTime) {
      setData(cachedData.current)
      setLoading(false)
      return cachedData.current
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetchFunction()
      
      if (result.success) {
        cachedData.current = result.data
        lastFetchTime.current = now
        setData(result.data)
        return result.data
      } else {
        throw new Error(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [fetchFunction, cacheTime])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Force refresh function
  const refresh = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    cachedData.current = null
    lastFetchTime.current = 0
  }, [])

  return { data, loading, error, refresh, invalidateCache }
}

/**
 * Simple in-memory cache for API responses
 */
class DataCache {
  constructor() {
    this.cache = new Map()
    this.timestamps = new Map()
  }

  set(key, data, ttl = 30000) {
    this.cache.set(key, data)
    this.timestamps.set(key, Date.now() + ttl)
  }

  get(key) {
    const expiry = this.timestamps.get(key)
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key)
      this.timestamps.delete(key)
      return null
    }
    return this.cache.get(key)
  }

  invalidate(key) {
    this.cache.delete(key)
    this.timestamps.delete(key)
  }

  clear() {
    this.cache.clear()
    this.timestamps.clear()
  }
}

export const dataCache = new DataCache()
