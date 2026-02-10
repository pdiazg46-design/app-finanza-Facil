'use client'

import { useState } from "react"
import { switchUserPlan } from "@/app/actions/user-actions"
import { useSession } from "next-auth/react"

export function PremiumUpgradeButton() {
    const [isLoading, setIsLoading] = useState(false)
    const { data: session, update } = useSession()

    const handleUpgrade = async () => {
        if (!session?.user?.email) return
        setIsLoading(true)
        const result = await switchUserPlan(session.user.email, "PREMIUM")
        if (result.success) {
            // Refresh the session token with the new plan
            await update({ plan: "PREMIUM" })
        }
        setIsLoading(false)
    }

    return (
    const isPremium = session?.user?.plan === "PREMIUM"

    if (isPremium) return null

    return (
        <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-300 to-amber-500 text-amber-950 rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-sm mb-1 active:scale-95"
        >
            {isLoading ? '...' : '✨ Upgrade a Premium'}
        </button>
    )
}
