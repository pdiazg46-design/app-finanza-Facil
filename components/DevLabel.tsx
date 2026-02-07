'use client'

/**
 * DevLabel - Etiqueta de desarrollo visible
 * Muestra el nombre del componente en la esquina superior izquierda
 * SOLO EN DESARROLLO
 */
export function DevLabel({ name }: { name: string }) {
    // Solo mostrar en desarrollo
    if (process.env.NODE_ENV === 'production') return null

    return (
        <div className="absolute top-1 left-1 bg-purple-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded z-[999999] shadow-lg select-text cursor-text">
            {name}
        </div>
    )
}
