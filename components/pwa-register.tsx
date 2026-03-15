"use client"

import { useEffect } from "react"

const SERVICE_WORKER_URL = "/sw.js"

export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return
    }

    if (process.env.NODE_ENV !== "production") {
      return
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, {
          scope: "/",
        })

        registration.update().catch(() => undefined)
      } catch (error) {
        console.error("Service worker registration failed:", error)
      }
    }

    if (document.readyState === "complete") {
      void registerServiceWorker()
      return
    }

    window.addEventListener("load", registerServiceWorker, { once: true })

    return () => {
      window.removeEventListener("load", registerServiceWorker)
    }
  }, [])

  return null
}
