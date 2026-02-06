'use client'

import { useState, useEffect } from 'react'
import { X, Settings, Mic, Trophy } from 'lucide-react'
import { RoutineCoach } from './RoutineCoach'
import { useLocaleContext } from './LocaleContext'

export function WelcomeBanner() {
    const { t } = useLocaleContext()
    const [isVisible, setIsVisible] = useState(false)
    const [isCoachOpen, setIsCoachOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        // Check if user has seen the banner
        const hasSeenBanner = localStorage.getItem('at-sit-welcome-banner-seen')
        if (!hasSeenBanner) {
            setIsVisible(true)
        }
    }, [])

    const handleDismiss = () => {
        localStorage.setItem('at-sit-welcome-banner-seen', 'true')
        setIsVisible(false)
    }

    if (!isMounted || !isVisible) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in slide-in-from-bottom-4">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-black text-slate-800">👋 {t('welcome.title')}</h2>
                    <button
                        onClick={handleDismiss}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {t('welcome.subtitle')}
                    </p>

                    <div className="space-y-3">
                        <div className="flex gap-3 items-start">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Trophy className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">{t('welcome.masterYourFreedom')}</p>
                                <p className="text-xs text-slate-500">{t('welcome.masterYourFreedomDesc')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => setIsCoachOpen(true)}
                            className="w-full bg-slate-900 text-white py-4 px-4 rounded-xl font-black text-sm uppercase active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                        >
                            <Trophy className="w-4 h-4 text-amber-400" /> {t('welcome.startRoutine')}
                        </button>

                        <button
                            onClick={handleDismiss}
                            className="w-full bg-slate-100 text-slate-500 py-3 px-4 rounded-xl font-bold text-xs uppercase active:scale-95 transition-all"
                        >
                            {t('welcome.skipAndExplore')}
                        </button>
                    </div>
                </div>
            </div>

            <RoutineCoach isOpen={isCoachOpen} onClose={() => {
                setIsCoachOpen(false)
                handleDismiss()
            }} />
        </div>
    )
}
