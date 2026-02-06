'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Componente silencioso que asegura que el cliente esté sincronizado con el servidor
 * al entrar a la aplicación, evitando datos estancados en caché de móviles.
 */
export function ClientSyncTrigger() {
    const router = useRouter()

    useEffect(() => {
        // Marcamos la entrada para evitar bucles infinitos si recargamos
        const lastSync = sessionStorage.getItem('at-sit-last-entry-sync')
        const now = Date.now()

        // Si pasaron más de 5 minutos desde la última sincronización en esta sesión
        if (!lastSync || now - parseInt(lastSync) > 300000) {
            console.log("[Sync] Forzando sincronización de entrada...")
            sessionStorage.setItem('at-sit-last-entry-sync', now.toString())

            // Trigger server-side revalidation by refreshing
            router.refresh()
        }
    }, [router])

    return null
}
