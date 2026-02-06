'use client'

import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'

export function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handler = (e: any) => {
            // Prevenir que el navegador lo muestre automáticamente
            e.preventDefault()
            // Guardar el evento para dispararlo luego
            setDeferredPrompt(e)
            setIsVisible(true)
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Verificar si ya está instalada
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false)
        }

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        // Mostrar el prompt nativo
        deferredPrompt.prompt()

        // Esperar la respuesta del usuario
        const { outcome } = await deferredPrompt.userChoice
        console.log(`User response to the install prompt: ${outcome}`)

        // Limpiar el evento guardado
        setDeferredPrompt(null)
        setIsVisible(false)
    }

    if (!isVisible) return null

    return (
        <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-3 py-1.5 bg-atsit-blue text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all"
        >
            <Download className="w-3 h-3" />
            Instalar App
        </button>
    )
}
