'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { RoutineCoach } from './RoutineCoach'

interface HelpButtonProps {
    variant?: 'icon' | 'menu-item'
}

export function HelpButton({ variant = 'icon' }: HelpButtonProps) {
    const [isCoachOpen, setIsCoachOpen] = useState(false)

    return (
        <>
            {variant === 'icon' ? (
                <button
                    onClick={() => setIsCoachOpen(true)}
                    className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                    title="Ayuda y Tutorial"
                >
                    <HelpCircle className="w-3.5 h-3.5" />
                </button>
            ) : (
                <button
                    onClick={() => setIsCoachOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition-all text-[9px] font-bold uppercase tracking-widest text-center mb-1 active:scale-95 border border-slate-100 bg-slate-50/50"
                >
                    <HelpCircle className="w-3.5 h-3.5" /> Ayuda / Tutorial
                </button>
            )}

            <RoutineCoach isOpen={isCoachOpen} onClose={() => setIsCoachOpen(false)} />
        </>
    )
}
