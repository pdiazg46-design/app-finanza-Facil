'use client'

import { useState } from "react"
import { useSession } from "next-auth/react"
import { switchUserPlan } from "@/app/actions/user-actions"
import { useRouter } from "next/navigation"

export function DevToolbar() {
    const { data: session, update } = useSession()
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    // Only show for the specific admin
    if (session?.user?.email !== "pdiazg46@gmail.com") {
        return null
    }

    const currentPlan = (session?.user as any)?.plan || "FREE"

    const handleSwitch = async (newPlan: "FREE" | "PREMIUM") => {
        setIsLoading(true)
        try {
            // 1. Update in DB
            await switchUserPlan(session?.user?.email!, newPlan)

            // 2. Update session client-side
            await update({ plan: newPlan })

            // 3. Force refresh to update server components
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-32 right-4 z-[9999]">
            {/* Toggle Button (When collapsed) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-black/40 backdrop-blur-md text-white/70 p-3 rounded-full shadow-lg border border-white/10 hover:bg-black/60 transition-all active:scale-95"
                >
                    <span className="text-[10px] font-black px-1 block">DEV</span>
                </button>
            )}

            {/* Toolbar Body (When open) */}
            {isOpen && (
                <div className="bg-black/90 backdrop-blur-xl text-white p-4 rounded-3xl shadow-2xl border border-white/10 flex flex-col gap-4 animate-in slide-in-from-bottom-2 duration-200 min-w-[220px]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-500 uppercase text-[9px] tracking-widest">Environment</span>
                            <span className="font-mono text-sm font-bold text-white tracking-tight">{currentPlan}</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/20 transition-all">✕</button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleSwitch("FREE")}
                            disabled={isLoading || currentPlan === "FREE"}
                            className={`px-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wide transition-all active:scale-95 flex flex-col items-center justify-center gap-1 ${currentPlan === "FREE"
                                    ? "bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] ring-2 ring-green-400"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                                }`}
                        >
                            <span>Free</span>
                            {currentPlan === "FREE" && <span className="w-1.5 h-1.5 rounded-full bg-black/50"></span>}
                        </button>
                        <button
                            onClick={() => handleSwitch("PREMIUM")}
                            disabled={isLoading || currentPlan === "PREMIUM"}
                            className={`px-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wide transition-all active:scale-95 flex flex-col items-center justify-center gap-1 ${currentPlan === "PREMIUM"
                                    ? "bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] ring-2 ring-purple-400"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                                }`}
                        >
                            <span>Premium</span>
                            {currentPlan === "PREMIUM" && <span className="w-1.5 h-1.5 rounded-full bg-white/50"></span>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
