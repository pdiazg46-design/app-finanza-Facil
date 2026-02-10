'use client'

import { FinanceEngine, TIERS } from "@/lib/finance-engine"
import { ShieldCheck, Info, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { usePrivacy } from "./PrivacyContext"
import { InfoTooltip } from "./InfoTooltip"
import { useSession } from "next-auth/react"
import { useLocaleContext } from "./LocaleContext"
import { getTierTranslationKey, getTierTypeFromInfo } from "@/lib/tier-translations"
import { DevLabel } from "./DevLabel"
import { formatCurrency } from "@/lib/currency-formatter"

import { QuickStatsCards } from "./QuickStatsCards"

interface FreedomDimensionProps {
    freedomDays: number;
    monthlyBurnRate: number;
    totalReserves: number; // balance + savings
    totalDebt?: number;
    totalAssets?: number;
    netWorth?: number;
    showStats?: boolean;
}

export function FreedomDimension({
    freedomDays,
    monthlyBurnRate,
    totalReserves,
    totalDebt = 0,
    totalAssets = 0,
    netWorth = 0,
    showStats = true
}: FreedomDimensionProps) {
    const { t } = useLocaleContext()
    const { isPrivate } = usePrivacy();
    const { data: session } = useSession();
    const dailyBurn = Math.floor(monthlyBurnRate / 30);
    const tier = FinanceEngine.getTier(freedomDays);
    const debtImpactDays = dailyBurn > 0 ? Math.round(totalDebt / dailyBurn) : 0;

    return (
        <div className="w-full flex flex-col gap-4 p-4 mb-4">
            {/* Tier Indicator Card */}
            <div className={`p-5 rounded-3xl border-l-[6px] ${tier.color.replace('text-', 'border-')} bg-white shadow-lg`}>
                <div className="flex items-center gap-2.5 mb-2">
                    <ShieldCheck className={`w-6 h-6 ${tier.color}`} />
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-widest">
                        {t('freedom.status')}: {t(getTierTranslationKey(getTierTypeFromInfo(tier)).label)}
                    </h3>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed italic font-medium">
                    "{t(getTierTranslationKey(getTierTypeFromInfo(tier)).description)}"
                </p>
            </div>

            {/* Patrimonio Neto Section (Premium Only) */}
            {(totalAssets > 0 || totalDebt > 0) && session?.user?.plan === 'PREMIUM' && (
                <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative border border-slate-800 shadow-xl mt-2">
                    <DevLabel name="FreedomDimension - MY REAL WEALTH Card" />

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 relative z-10 gap-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase leading-none">
                                {t('netWorth.title')}
                            </h3>
                            <InfoTooltip
                                title={t('netWorth.tooltipTitle')}
                                content={t('netWorth.tooltipContent')}
                                description={t('netWorth.tooltipDescription')}
                                variant="light"
                                debugName="MY REAL WEALTH - InfoTooltip"
                            />
                        </div>
                        <div className={`self-start sm:self-auto p-2 rounded-xl bg-white/10 backdrop-blur-md`}>
                            <TrendingUp className="w-6 h-6 text-atsit-blue" />
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        {/* Assets */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">{t('netWorth.whatIHave')}</span>
                            <span className="text-xl sm:text-2xl font-black text-white truncate">
                                {isPrivate ? (
                                    <span className="text-white/20 font-black tracking-widest">••••••</span>
                                ) : (
                                    formatCurrency(totalAssets + totalReserves)
                                )}
                            </span>
                        </div>

                        {/* Debts */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">{t('netWorth.whatIOwe')}</span>
                            <span className="text-xl sm:text-2xl font-black text-red-400 truncate">
                                {isPrivate ? (
                                    <span className="text-white/20 font-black tracking-widest">••••••</span>
                                ) : (
                                    formatCurrency(totalDebt)
                                )}
                            </span>
                        </div>

                        {/* Net Worth */}
                        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">{t('netWorth.realWealth')}</span>
                            <span className={`text-2xl sm:text-3xl font-black truncate ${netWorth >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                                {isPrivate ? (
                                    <span className="text-white/20 select-none italic text-xl tracking-[0.2em]">PRIVATE</span>
                                ) : (
                                    formatCurrency(netWorth)
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-white/10 rounded-2xl relative z-10 border border-white/5">
                        <p className="text-xs sm:text-sm text-white leading-relaxed font-bold">
                            {netWorth > 0
                                ? t('netWorth.positiveMessage')
                                : t('netWorth.negativeMessage')
                            }
                        </p>
                    </div>

                    {/* Decoración */}
                    <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-atsit-blue/10 rounded-full blur-3xl"></div>
                </div>
            )}

            {/* Quick Stats (Mobile / Default) */}
            {showStats && (
                <div className="mt-2">
                    <QuickStatsCards
                        monthlyBurnRate={monthlyBurnRate}
                        totalReserves={totalReserves}
                        totalDebt={totalDebt}
                    />
                </div>
            )}
        </div>
    );
}
