"use client";

import { FreedomCircle } from "@/components/FreedomCircle"
import { VoiceSimulator } from "@/components/VoiceSimulator"
import { ShieldCheck, Sparkles, LayoutDashboard, Wallet, TrendingUp, Settings, LogOut } from "lucide-react"
import { MovementsList } from "@/components/MovementsList"
import { SetupDrawerTrigger } from "@/components/SetupDrawerTrigger"
import { PrivacyProvider } from "@/components/PrivacyContext"
import { useLocaleContext } from "@/components/LocaleContext"
import { DesktopUserProfile } from "@/components/desktop/DesktopUserProfile"
import { AdminHeaderToggle } from "@/components/AdminHeaderToggle"
import { HelpButton } from "@/components/HelpButton"
import { PrivacyToggle } from "@/components/PrivacyToggle"
import { PremiumUpgradeButton } from "@/components/PremiumUpgradeButton"
import { CountrySelector } from "@/components/CountrySelector"
import { TranslatedLiquidityCards } from "@/components/TranslatedLiquidityCards"
import { DesktopCompass } from "@/components/desktop/DesktopCompass"
import { FreedomDimension } from "@/components/FreedomDimension"
import Image from "next/image"
import logo from "../../public/logo.png"

import { DesktopSetupDrawer } from "@/components/desktop/DesktopSetupDrawer"
import { WelcomeBanner } from "@/components/WelcomeBanner"
import { useState } from "react"

import { FreedomBadge } from "@/components/FreedomBadge"
import { QuickStatsCards } from "@/components/QuickStatsCards"

interface DesktopDashboardProps {
    user: any;
    isPremium: boolean;
    fund: any;
    metrics: {
        freedomDays: number;
        targetDays: number;
        totalLiquidReserves: number;
        projectedExpenses: number;
        disposableIncome: number;
        totalDebt: number;
        totalAssets: number;
        netWorth: number;
    }
}

export function DesktopDashboard({ user, isPremium, fund, metrics }: DesktopDashboardProps) {
    const { t } = useLocaleContext()
    const [isSetupOpen, setIsSetupOpen] = useState(false)
    const {
        freedomDays,
        targetDays,
        totalLiquidReserves,
        projectedExpenses,
        disposableIncome,
        totalDebt,
        totalAssets,
        netWorth
    } = metrics;

    return (
        <PrivacyProvider>
            <div className="min-h-screen bg-slate-50 flex overflow-hidden">

                {/* Sidebar */}
                <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-40">
                    <div className="p-6 border-b border-slate-100 flex flex-col items-center gap-4 text-center">
                        <div className="relative h-28 w-auto aspect-square mb-2 mx-auto">
                            <Image
                                src={logo}
                                alt="AT-SIT"
                                className="h-full w-full object-contain scale-125"
                                priority
                            />
                        </div>
                        <div>
                            <h1 className="font-black text-atsit-blue leading-tight text-xl uppercase tracking-[0.2em] drop-shadow-[0_2px_4px_rgba(0,56,112,0.15)]">
                                {t('app.title')}
                            </h1>
                        </div>
                        <div className="absolute top-6 right-6">
                            <PrivacyToggle />
                        </div>
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-semibold">
                            <LayoutDashboard className="w-5 h-5" />
                            Dashboard
                        </button>

                        <button
                            onClick={() => setIsSetupOpen(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
                        >
                            <Settings className="w-5 h-5" />
                            Cuentas Claves
                        </button>

                        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors">
                            <TrendingUp className="w-5 h-5" />
                            Inversiones
                        </button>
                    </nav>

                    <div className="p-4 border-t border-slate-100">
                        <DesktopUserProfile user={{ name: user.name, email: user.email, image: user.image }} />
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">

                    {/* Header */}
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-bold text-slate-800">Hola, {user.name} 👋</h2>
                                <FreedomBadge days={freedomDays || 0} />
                            </div>
                            <p className="text-slate-500">Aquí está tu resumen financiero de hoy.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* User Status Badge */}
                            {isPremium ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 rounded-full shadow-lg shadow-amber-500/20 border border-amber-300 animate-pulse">
                                    <Sparkles className="w-4 h-4 text-amber-900" />
                                    <span className="text-xs font-black text-amber-900 uppercase tracking-widest">Premium</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Plan Gratis</span>
                                </div>
                            )}

                            <div className="h-8 w-px bg-slate-200 mx-2"></div>

                            <CountrySelector />
                            <div className="h-8 w-px bg-slate-200 mx-2"></div>
                            <AdminHeaderToggle />
                            <HelpButton />
                            <PrivacyToggle />
                            {!isPremium && <PremiumUpgradeButton />}
                        </div>
                    </header>

                    {/* Dashboard Grid (3 Columns) */}
                    <div className="grid grid-cols-12 gap-6 items-start">

                        {/* Column 1: Analysis (4 cols) */}
                        <div className="col-span-4 space-y-6">
                            {/* Compass */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <h3 className="text-slate-400 font-black mb-4 uppercase tracking-widest text-xs text-center">Salud Financiera</h3>
                                <DesktopCompass freedomDays={freedomDays || 0} />
                            </div>

                            {/* Wealth & Tier */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <FreedomDimension
                                    freedomDays={freedomDays || 0}
                                    monthlyBurnRate={fund.monthlyBurnRate}
                                    totalReserves={totalLiquidReserves}
                                    totalDebt={totalDebt}
                                    totalAssets={totalAssets}
                                    netWorth={netWorth}
                                    showStats={false}
                                />
                            </div>
                        </div>

                        {/* Column 2: Cash Flow (4 cols) */}
                        <div className="col-span-4 space-y-6">
                            {/* Liquidity */}
                            <div>
                                <h3 className="text-slate-800 font-bold mb-3 text-sm uppercase tracking-wide">Liquidez Inmediata</h3>
                                <TranslatedLiquidityCards
                                    commonBalance={(fund as any).balance}
                                    disposableIncome={disposableIncome}
                                    projectedExpenses={projectedExpenses}
                                />
                            </div>

                            {/* Quick Stats Stack */}
                            <div>
                                <h3 className="text-slate-800 font-bold mb-3 text-sm uppercase tracking-wide">Métricas Clave</h3>
                                <QuickStatsCards
                                    monthlyBurnRate={fund.monthlyBurnRate}
                                    totalReserves={totalLiquidReserves}
                                    totalDebt={totalDebt}
                                />
                            </div>
                        </div>

                        {/* Column 3: Feed & Action (4 cols) */}
                        <div className="col-span-4 space-y-6">
                            {/* Feed */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
                                <h3 className="text-slate-700 font-black mb-6 flex items-center justify-between tracking-tight text-lg">
                                    Movimientos Recientes
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wide">En vivo</span>
                                </h3>
                                <div className="flex-1 overflow-hidden relative">
                                    <div className="absolute inset-0 overflow-y-auto pr-2">
                                        <MovementsList movements={fund.movements as any} isPremium={isPremium} />
                                    </div>
                                </div>
                            </div>

                            {/* Voice */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <p className="text-[10px] text-center text-slate-400 mb-3 font-bold uppercase tracking-widest">
                                    Presiona <kbd className="bg-slate-100 border border-slate-200 rounded px-1 text-slate-600 mx-1">ESPACIO</kbd> para hablar
                                </p>
                                <VoiceSimulator enableKeyboardShortcut={true} />
                            </div>
                        </div>

                    </div>
                </main>

            </div>
            <DesktopSetupDrawer
                isOpen={isSetupOpen}
                onClose={() => setIsSetupOpen(false)}
                budget={fund.budget as any}
                assets={(fund as any).assets as any}
                partnerInfo={{
                    name: (fund as any).partnerName,
                    contribution: (fund as any).partnerContribution
                }}
                freedomDays={freedomDays || 0}
            />
            <WelcomeBanner />
        </PrivacyProvider>
    )
}
