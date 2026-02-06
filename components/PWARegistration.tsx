'use client'

import { useEffect } from 'react'

/**
 * Componente que registra el Service Worker para habilitar el modo PWA instalable
 */
export function PWARegistration() {
    useEffect(() => {
        // En lugar de registrar, des-registramos para evitar que la app intente comportarse como PWA
        // y para limpiar la caché agresiva que podría estar mostrando banners antiguos.
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let registration of registrations) {
                    registration.unregister()
                    console.log("[PWA] Service Worker desvinculado por estrategia Play Store")
                }
            })
        }
    }, [])

    return null
}
