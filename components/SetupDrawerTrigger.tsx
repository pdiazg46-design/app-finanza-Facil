'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { SetupDrawer } from './SetupDrawer'
import { BudgetCategory } from '@/lib/db'

interface SetupDrawerTriggerProps {
    budget: any[]
    assets?: any[]
    partnerInfo: { name?: string, contribution?: number }
    freedomDays: number
}

export function SetupDrawerTrigger({ budget, assets, partnerInfo, freedomDays }: SetupDrawerTriggerProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-1.5 text-slate-400 hover:text-atsit-blue hover:bg-blue-50 rounded-lg transition-all"
                title="Configurar realidad financiera"
            >
                <Settings className="w-5 h-5" />
            </button>

            {isOpen && (
                <SetupDrawer
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    budget={budget}
                    assets={assets}
                    partnerInfo={partnerInfo}
                    freedomDays={freedomDays}
                />
            )}
        </>
    )
}
