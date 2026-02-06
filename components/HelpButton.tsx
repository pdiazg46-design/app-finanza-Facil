'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { RoutineCoach } from './RoutineCoach'

export function HelpButton() {
    const [isCoachOpen, setIsCoachOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsCoachOpen(true)}
                className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                title="Ayuda y Tutorial"
            >
                <HelpCircle className="w-3.5 h-3.5" />
            </button>

            <RoutineCoach isOpen={isCoachOpen} onClose={() => setIsCoachOpen(false)} />
        </>
    )
}
