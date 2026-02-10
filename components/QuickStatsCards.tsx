'use client'

import { InfoTooltip } from "./InfoTooltip"
import { TrendingDown, Wallet } from "lucide-react"
import { usePrivacy } from "./PrivacyContext"
import { useLocaleContext } from "./LocaleContext"
import { formatCurrency } from "@/lib/currency-formatter"
import { useSession } from "next-auth/react"

interface QuickStatsCardsProps {
    monthlyBurnRate: number
    totalReserves: number
    totalDebt: number
    orientation?: 'vertical' | 'horizontal'
}

export function QuickStatsCards({ monthlyBurnRate, totalReserves, totalDebt, orientation = 'vertical' }: QuickStatsCardsProps) {
    const { t } = useLocaleContext()
    const { isPrivate } = usePrivacy()
    const { data: session } = useSession()

    const dailyBurn = Math.floor(monthlyBurnRate / 30)
    const debtImpactDays = dailyBurn > 0 ? Math.round(totalDebt / dailyBurn) : 0
    const isPremium = session?.user?.plan === 'PREMIUM'
    const hasDebt = totalDebt > 0 && isPremium

    const containerClasses = orientation === 'vertical'
        ? "flex flex-col gap-3"
        : `grid gap-6 ${hasDebt ? 'grid-cols-3' : 'grid-cols-2'}`

    return (
        <div className={containerClasses}>
            {/* 1. Daily Burn */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                        <TrendingDown className="w-3 h-3 text-slate-400" />
                        {t('dimension.dailyCost')}
                    </p>
                    <div className="text-2xl font-black text-slate-900 leading-none">
                        {isPrivate ? <span className="text-slate-200">••••••</span> : formatCurrency(dailyBurn)}
                    </div>
                </div>
                <InfoTooltip title={t('tooltips.burnRate.title')} content={t('tooltips.burnRate.content')} />
            </div>

            {/* 2. Emergency Savings */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                        <Wallet className="w-3 h-3 text-slate-400" />
                        {t('dimension.emergencySavings')}
                    </p>
                    <div className="text-2xl font-black text-slate-900 leading-none">
                        {isPrivate ? <span className="text-slate-200">••••••</span> : formatCurrency(totalReserves)}
                    </div>
                </div>
                <InfoTooltip
                    title={t('tooltips.reserves.title')}
                    content={t('tooltips.reserves.content')}
                    description={t('tooltips.reserves.description')}
                />
            </div>

            {/* 3. Debt (Conditional) */}
            {hasDebt && (
                <div className="bg-red-50/50 p-4 rounded-3xl border border-red-100 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                            <TrendingDown className="w-3 h-3" />
                            {t('dimension.debtImpact')}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-black text-red-700 leading-none">
                                {isPrivate ? <span className="text-red-200">••••••</span> : formatCurrency(totalDebt)}
                            </div>
                            {!isPrivate && (
                                <span className="text-[10px] font-black text-red-500 bg-red-100 px-1.5 py-0.5 rounded-md">
                                    -{debtImpactDays} {t('dimension.days')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
