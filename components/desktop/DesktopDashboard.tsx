"use client";

import { FreedomCircle } from "@/components/FreedomCircle"
import { VoiceSimulator } from "@/components/VoiceSimulator"
import { ShieldCheck, Sparkles, LayoutDashboard, Wallet, TrendingUp, Settings, LogOut } from "lucide-react"
import { MovementsList } from "@/components/MovementsList"
import { SetupDrawerTrigger } from "@/components/SetupDrawerTrigger"
import { PrivacyProvider } from "@/components/PrivacyContext"
import { LocaleProvider } from "@/components/LocaleContext"
import { UserProfile } from "@/components/UserProfile"
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
        <LocaleProvider>
            <PrivacyProvider>
                <div className="min-h-screen bg-slate-50 flex overflow-hidden">

                    {/* Sidebar */}
                    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-40">
                        <div className="p-6 border-b border-slate-100 flex flex-col items-center gap-4 text-center">
                            <div className="relative h-20 w-auto aspect-square">
                                <Image
                                    src={logo}
                                    alt="AT-SIT"
                                    className="h-full w-full object-contain"
                                    priority
                                />
                            </div>
                            <div>
                                <h1 className="font-bold text-slate-800 leading-tight text-lg">Finanza Fácil</h1>
                                <p className="text-xs text-slate-500">Desktop Edition</p>
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
                            <UserProfile user={{ name: user.name, email: user.email, image: user.image }} />
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">

                        {/* Header */}
                        <header className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Hola, {user.name} 👋</h2>
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

                        {/* Dashboard Grid */}
                        <div className="grid grid-cols-12 gap-6">

                            {/* Left Column (Metrics) - Span 8 */}
                            <div className="col-span-8 space-y-6">

                                {/* Hero Cards Row */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[300px]">
                                        <h3 className="text-slate-500 font-medium mb-4 uppercase tracking-wider text-sm">Tu Libertad</h3>
                                        <div className="scale-125 transform">
                                            <FreedomCircle freedomDays={freedomDays || 0} targetDays={targetDays} />
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <h3 className="text-slate-500 font-medium mb-4 uppercase tracking-wider text-sm">Salud Financiera</h3>
                                        <DesktopCompass freedomDays={freedomDays || 0} />
                                    </div>
                                </div>

                                {/* Liquidity Row */}
                                <div className="grid grid-cols-2 gap-6">
                                    <TranslatedLiquidityCards
                                        commonBalance={(fund as any).balance}
                                        disposableIncome={disposableIncome}
                                        projectedExpenses={projectedExpenses}
                                    />
                                </div>

                                {/* Analyze Dimension */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <FreedomDimension
                                        freedomDays={freedomDays || 0}
                                        monthlyBurnRate={fund.monthlyBurnRate}
                                        totalReserves={totalLiquidReserves}
                                        totalDebt={totalDebt}
                                        totalAssets={totalAssets}
                                        netWorth={netWorth}
                                    />
                                </div>

                            </div>

                            {/* Right Column (Feed & Actions) - Span 4 */}
                            <div className="col-span-4 space-y-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
                                    <h3 className="text-slate-800 font-bold mb-4 flex items-center justify-between">
                                        Movimientos Recentes
                                        <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-full">En tiempo real</span>
                                    </h3>
                                    <div className="flex-1 overflow-hidden relative">
                                        {/* We recycle the mobile MovementsList but wrap it to fit well */}
                                        <div className="absolute inset-0 overflow-y-auto pr-2">
                                            <MovementsList movements={fund.movements as any} />
                                        </div>
                                    </div>

                                    {/* Desktop Voice Trigger */}
                                    <div className="mt-6 pt-6 border-t border-slate-100">
                                        <p className="text-xs text-center text-slate-400 mb-2">Presiona la barra <kbd className="bg-slate-100 border border-slate-200 rounded px-1">ESPACIO</kbd> para hablar</p>
                                        <VoiceSimulator />
                                    </div>
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
        </LocaleProvider>
    )
}
