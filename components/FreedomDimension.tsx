'use client'

import { FinanceEngine, TIERS } from "@/lib/finance-engine"
import { ShieldCheck, Info, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { usePrivacy } from "./PrivacyContext"
import { InfoTooltip } from "./InfoTooltip"
import { useSession } from "next-auth/react"
import { useLocaleContext } from "./LocaleContext"

interface FreedomDimensionProps {
    freedomDays: number;
    monthlyBurnRate: number;
    totalReserves: number; // balance + savings
    totalDebt?: number;
    totalAssets?: number;
    netWorth?: number;
}

export function FreedomDimension({
    freedomDays,
    monthlyBurnRate,
    totalReserves,
    totalDebt = 0,
    totalAssets = 0,
    netWorth = 0
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
                    <ShieldCheck className={`w-5 h-5 ${tier.color}`} />
                    <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">
                        {t('freedom.status')}: {t(tier.labelKey)}
                    </h3>
                </div>
                <p className="text-[12px] text-slate-700 leading-relaxed italic font-medium">
                    "{t(tier.descriptionKey)}"
                </p>
            </div>

            {/* Dimensional Breakdown Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between min-h-[100px]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-slate-900">
                            <TrendingDown className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-black uppercase tracking-wider">{t('dimension.burnRate')}</span>
                        </div>
                        <InfoTooltip
                            title={t('tooltips.burnRate.title')}
                            content={t('tooltips.burnRate.content')}
                        />
                    </div>
                    <div>
                        <div className="text-[16px] font-black text-slate-900">
                            {isPrivate ? (
                                <span className="text-slate-300">••••••</span>
                            ) : (
                                new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(dailyBurn)
                            )}
                        </div>
                        <p className="text-[11px] text-slate-700 font-bold mt-1 uppercase tracking-tight">{t('dimension.dailyCost')}</p>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between min-h-[100px]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-slate-900">
                            <Wallet className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-black uppercase tracking-wider">{t('dimension.reserves')}</span>
                        </div>
                        <InfoTooltip
                            title={t('tooltips.reserves.title')}
                            content={t('tooltips.reserves.content')}
                            description={t('tooltips.reserves.description')}
                        />
                    </div>
                    <div>
                        <div className="text-[16px] font-black text-slate-900">
                            {isPrivate ? (
                                <span className="text-slate-300">••••••</span>
                            ) : (
                                new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(totalReserves)
                            )}
                        </div>
                        <p className="text-[11px] text-slate-700 font-black mt-1 uppercase tracking-tight">{t('dimension.emergencySavings')}</p>
                    </div>
                </div>

                {totalDebt > 0 && session?.user?.plan === 'PREMIUM' && (
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100 col-span-2">
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5 text-red-700">
                                <TrendingDown className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider">{t('dimension.debtImpact')}</span>
                            </div>
                            <span className="text-[11px] font-black text-red-700">
                                {isPrivate ? '---' : `-${debtImpactDays} días`}
                            </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <div className="text-[16px] font-black text-red-800">
                                {isPrivate ? (
                                    <span className="text-red-300">••••••</span>
                                ) : (
                                    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(totalDebt)
                                )}
                            </div>
                            <p className="text-[11px] text-red-700 font-black italic">{t('dimension.allPending')}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Patrimonio Neto Section (Premium Only) */}
            {(totalAssets > 0 || totalDebt > 0) && session?.user?.plan === 'PREMIUM' && (
                <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative border border-slate-800 shadow-xl mt-2">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black tracking-tight text-white uppercase">{t('netWorth.title')}</h3>
                            <InfoTooltip
                                title={t('netWorth.tooltipTitle')}
                                content={t('netWorth.tooltipContent')}
                                description={t('netWorth.tooltipDescription')}
                                variant="light"
                            />
                        </div>
                        <div className={`p-2 rounded-xl bg-white/10 backdrop-blur-md`}>
                            <TrendingUp className="w-5 h-5 text-atsit-blue" />
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{t('netWorth.whatIHave')}</span>
                            <span className="text-lg font-black text-white">
                                {isPrivate ? (
                                    <span className="text-white/20 font-black tracking-widest">••••••</span>
                                ) : (
                                    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(totalAssets + totalReserves)
                                )}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{t('netWorth.whatIOwe')}</span>
                            <span className="text-lg font-black text-red-400">
                                {isPrivate ? (
                                    <span className="text-white/20 font-black tracking-widest">••••••</span>
                                ) : (
                                    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(totalDebt)
                                )}
                            </span>
                        </div>

                        <div className="pt-5 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[13px] font-black text-white uppercase tracking-widest">{t('netWorth.realWealth')}</span>
                            <span className={`text-2xl font-black ${netWorth >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                                {isPrivate ? (
                                    <span className="text-white/20 select-none italic text-lg tracking-[0.2em]">PRIVATE</span>
                                ) : (
                                    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(netWorth)
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-white/10 rounded-2xl relative z-10 border border-white/5">
                        <p className="text-[13px] text-white leading-relaxed font-black">
                            {netWorth > 0
                                ? `Tu patrimonio neto es positivo. Estás construyendo riqueza real más allá de tu flujo mensual.`
                                : `Tus deudas superan tus activos actuales. Cada aporte al fondo común es un paso para recuperar tu patrimonio neto.`
                            }
                        </p>
                    </div>

                    {/* Decoración */}
                    <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-atsit-blue/10 rounded-full blur-3xl"></div>
                </div>
            )}
        </div>
    );
}
