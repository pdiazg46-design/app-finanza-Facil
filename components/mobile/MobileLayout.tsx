import { FreedomCircle } from "@/components/FreedomCircle"
import { VoiceSimulator } from "@/components/VoiceSimulator"
import { ShieldCheck, Sparkles } from "lucide-react"
import { MovementsList } from "@/components/MovementsList"
import { SetupDrawerTrigger } from "@/components/SetupDrawerTrigger"
import { PrivacyProvider } from "@/components/PrivacyContext"
import { LocaleProvider } from "@/components/LocaleContext"
import { UserProfile } from "@/components/UserProfile"
import { AdminHeaderToggle } from "@/components/AdminHeaderToggle"
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
                {/* <ClientSyncTrigger /> */}
                <div className="min-h-screen bg-slate-50 flex flex-col items-center">
                    <main className="w-full max-w-md h-screen h-[100dvh] bg-white flex flex-col relative overflow-hidden shadow-2xl">
                        {/* Header - FIXED */}
                        <header className="fixed top-0 left-0 right-0 max-w-md mx-auto bg-white shrink-0 px-5 pt-4 pb-2 flex justify-between items-center z-30 border-b border-slate-50 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="relative" style={{ height: '42px', width: 'auto' }}>
                                    <Image
                                        src={logo}
                                        alt="AT-SIT"
                                        className="h-full w-auto object-contain"
                                        priority
                                        style={{ height: '100%', width: 'auto' }}
                                    />
                                </div>
                                {isPremium ? (
                                    <span className="relative bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 text-[8px] font-black text-slate-900 px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg shadow-amber-500/50 border-2 border-amber-300 animate-pulse">
                                        <span className="relative z-10">Premium</span>
                                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></span>
                                    </span>
                                ) : (
                                    <span className="bg-slate-100 text-[8px] font-bold text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">Gratis</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2.5">
                                <CountrySelector />
                                <AdminHeaderToggle />
                                <div className="w-px h-4 bg-slate-100 mx-1" /> {/* Divider */}
                                <HelpButton />
                                <PrivacyToggle />
                                <SetupDrawerTrigger
                                    budget={fund.budget as any}
                                    assets={(fund as any).assets as any}
                                    partnerInfo={{
                                        name: (fund as any).partnerName,
                                        contribution: (fund as any).partnerContribution
                                    }}
                                    freedomDays={freedomDays || 0}
                                />
                                <UserProfile user={{ name: user.name, email: user.email, image: user.image }} />
                            </div>
                        </header>

                        {/* Premium Banner for Free Users */}
                        {!isPremium && (
                            <div className="bg-blue-600 text-white px-4 py-2 text-[10px] flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-500">
                                <p className="font-bold flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" /> ¡Pásate a Premium y activa el Asistente AI avanzado!
                                </p>
                                <PremiumUpgradeButton />
                            </div>
                        )}

                        {/* Scrollable Content - Padding for fixed header */}
                        <div className="flex-1 overflow-y-auto px-4 pt-[70px] pb-36 overscroll-behavior-none">
                            <h2 className="text-center text-[14px] font-black uppercase tracking-[0.15em] mb-1 mt-2 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent drop-shadow-sm">
                                Finanza Fácil
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

                            <MovementsList movements={fund.movements as any} isPremium={isPremium} />
                        </div>

                        {/* Voice Simulator */}
                        <VoiceSimulator />

                        <div id="mobile-drawer-root" className="absolute inset-0 pointer-events-none z-[100]"></div>
                    </main>
                </div>
            </PrivacyProvider>

            {/* Welcome Banner (first-time users) */}
            <WelcomeBanner />
        </LocaleProvider>
    )
}
