"use client";

import { FreedomCircle } from "@/components/FreedomCircle"
import { VoiceSimulator } from "@/components/VoiceSimulator"
import { ShieldCheck, Sparkles } from "lucide-react"
import { MovementsList } from "@/components/MovementsList"
import { SetupDrawerTrigger } from "@/components/SetupDrawerTrigger"
import { PrivacyProvider } from "@/components/PrivacyContext"
import { useLocaleContext } from "@/components/LocaleContext"
import { UserProfile } from "@/components/UserProfile"

import { HelpButton } from "@/components/HelpButton"
import { PrivacyToggle } from "@/components/PrivacyToggle"
import { PremiumUpgradeButton } from "@/components/PremiumUpgradeButton"
import { WelcomeBanner } from "@/components/WelcomeBanner"
import { CountrySelector } from "@/components/CountrySelector"
import { TranslatedLiquidityCards } from "@/components/TranslatedLiquidityCards"
import { CompassSection } from "@/components/CompassSection"
import { FreedomDimension } from "@/components/FreedomDimension"
import Image from "next/image"
import logo from "../../public/logo.png"

interface MobileLayoutProps {
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

export function MobileLayout({ user, isPremium, fund, metrics }: MobileLayoutProps) {
    const { t } = useLocaleContext()
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
        <>
            <PrivacyProvider>
                {/* <ClientSyncTrigger /> */}
                <div className="min-h-screen bg-slate-50 flex flex-col items-center">
                    {/* ... content ... */}
                    <main className="w-full max-w-md h-screen h-[100dvh] bg-white flex flex-col relative overflow-hidden shadow-2xl">
                        {/* Header - FIXED */}
                        <header className="fixed top-0 left-0 right-0 max-w-md mx-auto bg-white shrink-0 px-3 pt-3 pb-2 flex justify-between items-center z-30 border-b border-slate-50 shadow-sm transition-all duration-300">
                            <div className="flex items-center gap-1.5">
                                <div className="relative" style={{ height: '36px', width: 'auto' }}>
                                    <Image
                                        src={logo}
                                        alt="AT-SIT"
                                        className="h-full w-auto object-contain"
                                        priority
                                        style={{ height: '100%', width: 'auto' }}
                                    />
                                </div>
                                {isPremium ? (
                                    <span className="scale-75 origin-left relative bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 text-[8px] font-black text-slate-900 px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg shadow-amber-500/50 border-2 border-amber-300">
                                        <span className="relative z-10">Premium</span>
                                    </span>
                                ) : (
                                    <span className="scale-75 origin-left bg-slate-100 text-[8px] font-bold text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">Gratis</span>
                                )}
                            </div>
                            <div className="flex items-center gap-0.5">
                                <div className="scale-90"><CountrySelector /></div>

                                <div className="scale-90"><HelpButton /></div>
                                <div className="scale-90"><PrivacyToggle /></div>
                                <div className="scale-90">
                                    <SetupDrawerTrigger
                                        budget={fund.budget as any}
                                        assets={(fund as any).assets as any}
                                        partnerInfo={{
                                            name: (fund as any).partnerName,
                                            contribution: (fund as any).partnerContribution
                                        }}
                                        freedomDays={freedomDays || 0}
                                    />
                                </div>
                                <div className="pl-1"><UserProfile user={{ name: user.name, email: user.email, image: user.image }} /></div>
                            </div>
                        </header>



                        {/* Scrollable Content - Padding for fixed header */}
                        <div className="flex-1 overflow-y-auto px-4 pt-[70px] pb-36 overscroll-behavior-none">
                            <h2 className="text-center text-[16px] font-black uppercase tracking-[0.2em] mb-2 mt-4 text-[#4379F2] drop-shadow-[0_2px_4px_rgba(0,56,112,0.15)]">
                                {t('app.title')}
                            </h2>

                            <FreedomCircle freedomDays={freedomDays || 0} targetDays={targetDays} />

                            <CompassSection freedomDays={freedomDays || 0} />

                            {/* Cognitive Decision cards Section */}
                            <TranslatedLiquidityCards
                                commonBalance={(fund as any).balance}
                                disposableIncome={disposableIncome}
                                projectedExpenses={projectedExpenses}
                            />

                            <FreedomDimension
                                freedomDays={freedomDays || 0}
                                monthlyBurnRate={fund.monthlyBurnRate}
                                totalReserves={totalLiquidReserves}
                                totalDebt={totalDebt}
                                totalAssets={totalAssets}
                                netWorth={netWorth}
                            />

                            <MovementsList movements={fund.movements as any} isPremium={isPremium} isMobile={true} />
                        </div>

                        {/* Voice Simulator */}
                        <VoiceSimulator />

                        <div id="mobile-drawer-root" className="absolute inset-0 pointer-events-none z-[100]"></div>
                    </main>
                </div>
            </PrivacyProvider>

            {/* Welcome Banner (first-time users) */}
            <WelcomeBanner />
        </>
    )
}
