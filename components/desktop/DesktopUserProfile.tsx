"use client";

import { signOut, useSession } from "next-auth/react"
import { LogOut, Users, RefreshCw, MoreHorizontal, Sparkles, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { AdminUsersModal } from "../AdminUsersModal"
import { InstallButton } from "../InstallButton"

interface DesktopUserProfileProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
}

export function DesktopUserProfile({ user }: DesktopUserProfileProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isAdminOpen, setIsAdminOpen] = useState(false)
    const { data: session } = useSession()

    const isAdmin = user.email === "pdiazg46@gmail.com"

    return (
        <div className="relative">
            {/* Profile Trigger - Full Row */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
            >
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                        {user.image ? (
                            <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-bold">
                                {(user.name || user.email || "U").charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    {isAdmin && (
                        <div className="absolute -top-1 -right-1 bg-amber-100 text-amber-600 p-0.5 rounded-full border border-white">
                            <Sparkles className="w-3 h-3" />
                        </div>
                    )}
                </div>

                <div className="flex-1 text-left overflow-hidden">
                    <p className="text-sm font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors">
                        {user.name || "Usuario"}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 truncate">
                        {user.email}
                    </p>
                </div>

                <MoreHorizontal className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </button>

            {/* Upward Menu */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute bottom-[110%] left-0 w-full z-50 bg-white border border-slate-100 shadow-xl rounded-2xl p-2 animate-in slide-in-from-bottom-2 duration-200 fade-in">

                        <div className="px-3 py-2 border-b border-slate-50 mb-1 bg-slate-50/50 rounded-t-xl -mx-2 -mt-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                SUPER USER TOOLS
                            </p>
                        </div>

                        <div className="mt-1 space-y-1">
                            <InstallButton />

                            <button
                                onClick={() => {
                                    if (confirm("Se forzará la descarga de datos nuevos y se limpiará la caché local. ¿Continuar?")) {
                                        localStorage.clear();
                                        sessionStorage.clear();
                                        window.location.reload();
                                    }
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all text-xs font-bold active:scale-95"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Limpiar Caché</span>
                            </button>

                            {isAdmin && (
                                <button
                                    onClick={() => {
                                        setIsAdminOpen(true)
                                        setIsOpen(false)
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl transition-all text-xs font-bold active:scale-95"
                                >
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    <span>Panel Admin</span>
                                </button>
                            )}

                            <div className="h-px bg-slate-100 my-1" />

                            <button
                                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-bold active:scale-95 group"
                            >
                                <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            <AdminUsersModal
                isOpen={isAdminOpen}
                onClose={() => setIsAdminOpen(false)}
            />
        </div>
    )
}
