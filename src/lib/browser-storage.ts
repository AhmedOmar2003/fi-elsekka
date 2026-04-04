"use client"

type StorageValue = string | null

export interface SafeStorageLike {
  getItem: (key: string) => StorageValue
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const noopStorage: SafeStorageLike = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

function resolveLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function getSafeLocalStorage(): SafeStorageLike {
  const storage = resolveLocalStorage()
  if (!storage) return noopStorage

  return {
    getItem: (key) => {
      try {
        return storage.getItem(key)
      } catch {
        return null
      }
    },
    setItem: (key, value) => {
      try {
        storage.setItem(key, value)
      } catch {}
    },
    removeItem: (key) => {
      try {
        storage.removeItem(key)
      } catch {}
    },
  }
}

export function safeJsonParse<T>(value: StorageValue, fallback: T): T {
  if (!value) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}
