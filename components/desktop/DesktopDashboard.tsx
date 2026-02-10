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
                            <h1 className="font-black text-[#4379F2] leading-tight text-xl uppercase tracking-[0.2em] drop-shadow-[0_2px_4px_rgba(0,56,112,0.15)]">
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
                    <header className="grid grid-cols-3 items-center mb-8">
                        {/* Left: Greeting */}
                        <div className="justify-self-start">
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                Hola, {user.name} <span className="text-2xl">👋</span>
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">Aquí está tu resumen financiero.</p>
                        </div>

                        {/* Center: Freedom Badge (Hero) */}
                        <div className="justify-self-center transform scale-125">
                            <FreedomBadge days={freedomDays || 0} />
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center justify-end gap-3 justify-self-end">
                            {/* User Status Badge */}
                            {isPremium ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 rounded-full shadow-lg shadow-amber-500/20 border border-amber-300">
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

                    {/* BENTO BOX LAYOUT (Fintech Architect Mode) */}
                    <div className="flex flex-col gap-8">

                        {/* ZONA SUPERIOR (80% Focus) */}
                        <div className="space-y-6">

                            {/* KPI STRIP: Liquidity & Velocity */}
                            <div className="grid grid-cols-12 gap-6">
                                {/* Liquidity (4 cols) */}
                                <div className="col-span-5">
                                    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200 h-full flex flex-col justify-center">
                                        <h3 className="text-black font-black text-xs uppercase tracking-widest mb-4 opacity-50">Liquidez Inmediata</h3>
                                        <TranslatedLiquidityCards
                                            commonBalance={(fund as any).balance}
                                            disposableIncome={disposableIncome}
                                            projectedExpenses={projectedExpenses}
                                        />
                                    </div>
                                </div>

                                {/* Velocity Metrics (8 cols) */}
                                <div className="col-span-7">
                                    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200 h-full flex flex-col justify-center">
                                        <h3 className="text-black font-black text-xs uppercase tracking-widest mb-4 opacity-50">Métricas de Velocidad</h3>
                                        <QuickStatsCards
                                            monthlyBurnRate={fund.monthlyBurnRate}
                                            totalReserves={totalLiquidReserves}
                                            totalDebt={totalDebt}
                                            orientation="horizontal"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* DEEP ANALYSIS ROW */}
                            <div className="grid grid-cols-12 gap-6">
                                {/* Wealth Structure (8 cols) */}
                                <div className="col-span-8">
                                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 h-full">
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

                                {/* Health Compass (4 cols) */}
                                <div className="col-span-4">
                                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 h-full flex flex-col items-center justify-center relative overflow-hidden">
                                        <div className="absolute top-4 left-0 w-full text-center z-10">
                                            <h3 className="text-black font-black text-xs uppercase tracking-widest opacity-50">Salud Financiera</h3>
                                        </div>
                                        <div className="scale-110 mt-4">
                                            <DesktopCompass freedomDays={freedomDays || 0} />
                                        </div>

                                        {/* Voice Control integrated into Compass Card */}
                                        <div className="w-full mt-4 pt-4 border-t border-slate-100">
                                            <VoiceSimulator enableKeyboardShortcut={true} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* ZONA INFERIOR (20% - Reference) */}
                        <div className="mt-8 border-t-2 border-slate-100 pt-8 opacity-60 hover:opacity-100 transition-opacity duration-500">
                            <h3 className="text-black font-black text-xl mb-6 flex items-center gap-3">
                                MOVIMIENTOS RECIENTES
                                <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] rounded-md uppercase tracking-widest font-bold">Historial</span>
                            </h3>
                            <div className="grid grid-cols-1">
                                <MovementsList movements={fund.movements as any} isPremium={isPremium} />
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
