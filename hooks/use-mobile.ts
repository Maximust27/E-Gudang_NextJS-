"use client"

import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768
const MEDIA_QUERY = `(width < ${MOBILE_BREAKPOINT}px)`

function subscribe(callback: () => void) {
  const mediaQuery = window.matchMedia(MEDIA_QUERY)

  mediaQuery.addEventListener("change", callback)

  return () => {
    mediaQuery.removeEventListener("change", callback)
  }
}

function getSnapshot() {
  return window.matchMedia(MEDIA_QUERY).matches
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
}