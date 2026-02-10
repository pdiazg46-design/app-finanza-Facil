"use client";

import { Sparkles, TrendingUp, Shield, Zap, Crown, Target } from "lucide-react"
import { FinanceEngine } from "@/lib/finance-engine"
import { useLocaleContext } from "@/components/LocaleContext"

interface DesktopCompassProps {
    freedomDays: number
}

export function DesktopCompass({ freedomDays }: DesktopCompassProps) {
    const { t } = useLocaleContext()
    const tier = FinanceEngine.getTier(freedomDays)

    // Mapping icons to tiers for visual flair
    const getTierIcon = () => {
        switch (tier.label) {
            case 'Supervivencia': return <Target className="w-8 h-8 text-red-500" />;
            case 'Seguridad': return <Shield className="w-8 h-8 text-orange-400" />;
            case 'Flexibilidad': return <TrendingUp className="w-8 h-8 text-[#0056B3]" />;
            case 'Independencia': return <Zap className="w-8 h-8 text-emerald-500" />;
            default: return <Crown className="w-8 h-8 text-purple-600" />;
        }
    }

    const circleColor = tier.label === 'Supervivencia' ? 'from-red-500 to-red-600' :
        tier.label === 'Seguridad' ? 'from-orange-400 to-orange-500' :
            tier.label === 'Flexibilidad' ? 'from-blue-600 to-blue-700' :
                tier.label === 'Independencia' ? 'from-emerald-500 to-emerald-600' :
                    'from-purple-600 to-purple-700';

    const bgColor = tier.label === 'Supervivencia' ? 'bg-red-50' :
        tier.label === 'Seguridad' ? 'bg-orange-50' :
            tier.label === 'Flexibilidad' ? 'bg-blue-50' :
                tier.label === 'Independencia' ? 'bg-emerald-50' :
                    'bg-purple-50';

    return (
        <div className={`h-full flex flex-col justify-between rounded-xl p-4 ${bgColor} transition-colors duration-500`}>

            {/* Header Section */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-600 mb-1">Status Actual</h4>
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-slate-800">{t(tier.descriptionKey)}</span>
                    </div>
                </div>
                <div className={`p-3 rounded-full bg-white shadow-sm ring-1 ring-black/5`}>
                    {getTierIcon()}
                </div>
            </div>

            {/* Description Section */}
            <div className="flex-1">
                <p className="text-base text-slate-700 leading-relaxed font-medium">
                    {t('freedom.compass.description')}
                </p>
            </div>

            {/* Tip / Footer Section */}
            <div className="mt-4 pt-4 border-t border-black/5">
                <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-slate-700 italic">
                        "{t('freedom.compass.tip')}"
                    </p>
                </div>
            </div>

            {/* Progress Visual Helper (Decorator) */}
            <div className="mt-3 w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                <div className={`h-full w-full bg-gradient-to-r ${circleColor} opacity-75`}></div>
            </div>
        </div>
    )
}
