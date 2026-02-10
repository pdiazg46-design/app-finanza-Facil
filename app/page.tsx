import { getFundMetrics } from "./actions/fund-actions"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { MobileLayout } from "@/components/mobile/MobileLayout"
import { DesktopDashboard } from "@/components/desktop/DesktopDashboard"

// Force dynamic rendering because we use auth() which requires headers
export const dynamic = 'force-dynamic'


export default async function Home() {
  let session;
  try {
    session = await auth()
  } catch (error) {
    console.error("Auth Error:", error)
    // Fallback UI for fatal auth errors
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Error de Sistema</h2>
          <p className="text-sm text-slate-500 mb-4 break-words">
            No pudimos conectar con el servidor seguro.
            <br /><br />
            <span className="font-mono text-xs bg-slate-100 p-1 rounded">{(error as any)?.message || "Unknown Auth Error"}</span>
          </p>
          <a href="/auth/signin" className="block w-full bg-slate-900 text-white py-3 rounded-xl font-bold uppercase text-xs">
            Intentar Login Nuevamente
          </a>
        </div>
      </div>
    )
  }

  // Guard: Require Login
  if (!session?.user?.email) {
    redirect("/auth/signin")
  }

  const user = session.user
  const isPremium = (user as any).plan === "PREMIUM"

  // Fetch real data from database
  let fund, freedomDays, totalLiquidReserves, targetDays, metrics, projectedExpenses, disposableIncome, totalDebt, totalAssets, netWorth;

  try {
    metrics = await getFundMetrics()
    fund = metrics.fund
    freedomDays = metrics.freedomDays
    totalLiquidReserves = metrics.totalLiquidReserves
    targetDays = metrics.targetDays
    projectedExpenses = metrics.projectedExpenses
    disposableIncome = metrics.disposableIncome
    totalDebt = metrics.totalDebt
    totalAssets = metrics.totalAssets
    netWorth = metrics.netWorth
  } catch (error) {
    console.error("[Home Page] Error loading metrics:", error)
    // Fallback to safe defaults if DB fails
    fund = {
      balance: 0,
      monthlyBurnRate: 0,
      budget: {},
      assets: [],
      partnerName: "Pareja",
      partnerContribution: 0,
      movements: []
    }
    metrics = {
      freedomDays: 0,
      targetDays: 90,
      totalLiquidReserves: 0,
      projectedExpenses: 0,
      disposableIncome: 0,
      totalDebt: 0,
      totalAssets: 0,
      netWorth: 0
    }
  }

  const props = {
    user,
    isPremium,
    fund,
    metrics: {
      freedomDays: metrics.freedomDays || 0,
      targetDays: metrics.targetDays || 90,
      totalLiquidReserves: metrics.totalLiquidReserves || 0,
      projectedExpenses: metrics.projectedExpenses || 0,
      disposableIncome: metrics.disposableIncome || 0,
      totalDebt: metrics.totalDebt || 0,
      totalAssets: metrics.totalAssets || 0,
      netWorth: metrics.netWorth || 0
    }
  }

  return (
    <>
      <div className="md:hidden">
        <MobileLayout {...props} />
      </div>
      <div className="hidden md:block">
        <DesktopDashboard {...props} />
      </div>
    </>
  )
}

