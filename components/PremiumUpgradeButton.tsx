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
        <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="bg-white text-blue-600 px-3 py-1 rounded-lg font-black uppercase text-[8px] hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
            {isLoading ? '...' : 'Upgrade'}
        </button>
    )
}
