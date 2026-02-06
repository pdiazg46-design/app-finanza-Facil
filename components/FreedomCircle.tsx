'use client'

import { FinanceEngine } from "@/lib/finance-engine"
import { Sparkles } from "lucide-react"
import { usePrivacy } from "./PrivacyContext"
import { InfoTooltip } from "./InfoTooltip"
import { useLocaleContext } from "./LocaleContext"

interface FreedomCircleProps {
    freedomDays: number
    targetDays: number
}

export function FreedomCircle({ freedomDays, targetDays }: FreedomCircleProps) {
    const { t } = useLocaleContext()
    const { isPrivate } = usePrivacy()
    const tier = FinanceEngine.getTier(freedomDays)

    // Dinamizar el color del círculo según el Tier
    const circleColor = freedomDays < 90 ? 'bg-red-500' :
        freedomDays < 180 ? 'bg-orange-400' :
            freedomDays < 365 ? 'bg-[#0056B3]' :
                freedomDays < 1000 ? 'bg-emerald-500' :
                    'bg-purple-600';

    return (
        <div className="w-full flex flex-col items-center justify-center py-2">
            <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Ambient Glow */}
                <div className={`absolute inset-4 rounded-full ${circleColor} opacity-20 blur-2xl animate-pulse`}></div>

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute top-0 right-0 z-10">
                        <InfoTooltip
                            title="Días de Respiro"
                            content="Representa el tiempo que podrías vivir sin ingresos externos manteniendo tus gastos actuales."
                            description="Tus días son el resultado de dividir tu respaldo total (Saldos + Inversiones) por lo que gastas cada día."
                        />
                    </div>
                    <div className={`w-32 h-32 rounded-full ${circleColor} shadow-2xl flex items-center justify-center transition-colors duration-700`}>
                        <div className="flex flex-col items-center justify-center text-center px-1">
                            <span className={`font-black text-white tracking-tighter leading-none font-[family-name:var(--font-montserrat)] ${freedomDays.toString().length > 6 ? 'text-xl' :
                                freedomDays.toString().length > 4 ? 'text-2xl' :
                                    'text-4xl'
                                }`}>
                                {new Intl.NumberFormat('es-CL').format(freedomDays)}
                            </span>
                            <span className="text-[12px] font-black text-white uppercase tracking-wider mt-0.5 font-[family-name:var(--font-montserrat)]">
                                DÍAS
                            </span>
                            <div className="flex items-center gap-1 mt-1 bg-white/20 px-2 py-0.5 rounded-full">
                                <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                                <span className="text-[11px] text-white font-black uppercase">
                                    {tier.label}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
