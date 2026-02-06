'use client'

import { useState } from "react"
import { switchUserPlan } from "../app/actions/user-actions"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { RefreshCw } from "lucide-react"

export function AdminHeaderToggle() {
    const { data: session, update } = useSession()
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    // Security check on client side (also enforced on server)
    if (session?.user?.email !== "pdiazg46@gmail.com") return null

    const currentPlan = (session?.user as any)?.plan || "FREE"

    const togglePlan = async () => {
        setIsLoading(true)
        const newPlan = currentPlan === "FREE" ? "PREMIUM" : "FREE"
        try {
            await switchUserPlan(session?.user?.email!, newPlan)
            await update({ plan: newPlan })
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={togglePlan}
            disabled={isLoading}
            className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
            title="Admin Toggle Plan"
        >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
    )
}
