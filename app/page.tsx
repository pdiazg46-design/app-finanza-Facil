// import { getFundMetrics } from "./actions/fund-actions"
import { FreedomCircle } from "@/components/FreedomCircle"
import { VoiceSimulator } from "@/components/VoiceSimulator"
import { MiniChart } from "@/components/MiniChart"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldCheck, Sparkles, TrendingDown, Wallet } from "lucide-react"
import { MovementsList } from "@/components/MovementsList"
import { SetupDrawerTrigger } from "@/components/SetupDrawerTrigger"
import { PrivacyProvider } from "@/components/PrivacyContext"
import { CurrencyText } from "@/components/CurrencyText"
import { InstallPWA } from "@/components/InstallPWA"
import { UserProfile } from "@/components/UserProfile"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  // Real Session
  const session = await auth()

  // Guard: Require Login
  if (!session?.user?.email) {
    redirect("/auth/signin")
  }

  const user = session.user
  const isPremium = (user as any).plan === "PREMIUM"

  // Mock Data
  const fund = {
    balance: 1500000,
    monthlyBurnRate: 800000,
    budget: {},
    assets: [],
    partnerName: "Pareja",
    partnerContribution: 0,
    movements: [
      { id: "1", type: "EXPENSE", amount: 15000, description: "Supermercado", date: new Date().toISOString(), category: "Alimentación" },
      { id: "2", type: "INCOME", amount: 2500000, description: "Sueldo", date: new Date().toISOString(), category: "Ingresos" },
      { id: "3", type: "EXPENSE", amount: 45000, description: "Combustible", date: new Date().toISOString(), category: "Transporte" },
    ]
  }
  const freedomDays = 45
  const totalLiquidReserves = 1200000
  const targetDays = 90
  const projectedExpenses = 750000
  const disposableIncome = 450000
  const totalDebt = 0
  const totalAssets = 0
  const netWorth = 1200000

  try {
    // const { fund, freedomDays, totalLiquidReserves, targetDays, projectedExpenses, disposableIncome, totalDebt, totalAssets, netWorth } = await getFundMetrics()

    return (
      <>
        <PrivacyProvider>
          {/* <ClientSyncTrigger /> */}
          <CountrySelector />
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
                <h2 className="text-center text-[10px] font-black text-atsit-blue uppercase tracking-[0.2em] mb-1 mt-2">
                  Finanza Fácil
                </h2>

                <FreedomCircle freedomDays={freedomDays || 0} targetDays={targetDays} />

                <CompassSection freedomDays={freedomDays || 0} />

                {/* Cognitive Decision cards Section */}
                <div className="grid grid-cols-2 gap-3 mt-4 mb-3">
                  <LiquidityCard
                    type="common"
                    title="Total Disponible"
                    subtitle="Entradas - Salidas fijos"
                    amount={(fund as any).balance}
                    projectedExpenses={projectedExpenses}
                    infoContent="Tus ingresos declarados menos los gastos fijos del mes. Es el monto total disponible para tus cuentas compartidas."
                    infoDescription="Mantener este pozo positivo asegura que tus compromisos fijos estén cubiertos."
                  />

                  <LiquidityCard
                    type="disposable"
                    title="Plata para Disfrutar"
                    subtitle="Tu margen hoy"
                    amount={disposableIncome}
                    infoContent="Tu margen real de hoy. Es la plata que queda libre después de asegurar tus gastos y deudas del mes."
                    infoDescription="Este es el dinero que puedes gastar hoy sin culpa y sin comprometer tu futuro."
                  />
                </div>

                <FreedomDimension
                  freedomDays={freedomDays || 0}
                  monthlyBurnRate={fund.monthlyBurnRate}
                  totalReserves={totalLiquidReserves}
                  totalDebt={totalDebt}
                  totalAssets={totalAssets}
                  netWorth={netWorth}
                />

                <MovementsList movements={fund.movements as any} />
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
  } catch (error) {
    console.error("[Home Page] Error loading metrics:", error)
    return null
  }
}

