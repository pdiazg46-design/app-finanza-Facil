'use client'

import { useState } from "react"
import { Info, Sparkles } from "lucide-react"
import { FinanceEngine } from "@/lib/finance-engine"
import { useLocaleContext } from "./LocaleContext"

interface CompassSectionProps {
    freedomDays: number
}

export function CompassSection({ freedomDays }: CompassSectionProps) {
    const { t } = useLocaleContext()
    const [showInfo, setShowInfo] = useState(false)
    const tier = FinanceEngine.getTier(freedomDays)

    const circleColor = tier.label === 'Supervivencia' ? 'bg-red-500' :
        tier.label === 'Seguridad' ? 'bg-orange-400' :
            tier.label === 'Flexibilidad' ? 'bg-[#0056B3]' :
                tier.label === 'Independencia' ? 'bg-emerald-500' :
                    'bg-purple-600';

    return (
        <div className="w-full flex flex-col items-center mb-4">
            <button
                onClick={() => setShowInfo(!showInfo)}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-slate-900 shadow-sm hover:bg-white hover:shadow-md transition-all active:scale-95"
            >
                <Info className="w-4 h-4 text-atsit-blue" />
                <span className="text-[12px] font-black uppercase tracking-widest font-[family-name:var(--font-montserrat)]">{t('freedom.compass.title')}</span>
            </button>

            {showInfo && (
                <div className="mt-4 w-full max-w-xs mx-auto bg-slate-900 text-white rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden z-20 text-left">
                    <div className={`absolute top-0 right-0 w-24 h-24 ${circleColor} opacity-20 blur-3xl -mr-12 -mt-12`}></div>
                    <div className="relative z-10">
                        <p className="font-black mb-3 text-sm flex items-center gap-2 uppercase tracking-widest italic">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                            Anatomía de tu Libertad
                        </p>
                        <p className="text-[11px] leading-relaxed text-slate-300 font-medium">
                            {t('freedom.compass.description')}
                            <strong> {t('freedom.compass.tip')}</strong>
                        </p>
                        <div className="mt-5 pt-5 border-t border-white/10">
                            <p className="text-[10px] text-slate-500 font-black uppercase mb-1 tracking-widest">{t('freedom.compass.currentLevel')}</p>
                            <p className="text-xs font-bold text-blue-300">{t(tier.descriptionKey)}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
