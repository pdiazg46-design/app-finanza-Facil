'use client'

import { signOut, useSession } from "next-auth/react"
import { LogOut, Users, RefreshCw } from "lucide-react"
import { useState } from "react"
import { AdminUsersModal } from "./AdminUsersModal"
import { InstallButton } from "./InstallButton"
import { PremiumUpgradeButton } from "./PremiumUpgradeButton"

interface UserProfileProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
}

export function UserProfile({ user }: UserProfileProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isAdminOpen, setIsAdminOpen] = useState(false)
    const { data: session } = useSession()

    const isAdmin = user.email === "pdiazg46@gmail.com"

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-9 h-9 rounded-full bg-slate-100 border-2 border-slate-100 shadow-sm overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-400 transition-all focus:outline-none"
            >
                {user.image ? (
                    <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-xs font-black text-slate-400">{(user.name || user.email || "U").charAt(0).toUpperCase()}</span>
                )}
            </button>

            {/* Logout Menu */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-11 z-50 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 min-w-[180px] animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-3 py-2 border-b border-slate-50 mb-1">
                            <p className="text-[10px] font-black text-slate-800 truncate">{user.name || "Usuario"}</p>
                            <p className="text-[8px] font-medium text-slate-400 truncate">{user.email}</p>
                        </div>

                        <div className="px-1 mt-1">
                            <InstallButton />

                            <div className="mb-1">
                                <PremiumUpgradeButton />
                            </div>

                            <button
                                onClick={() => {
                                    if (confirm("Se forzará la descarga de datos nuevos y se limpiará la caché local. ¿Continuar?")) {
                                        localStorage.clear();
                                        sessionStorage.clear();
                                        window.location.reload();
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50/50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100 mb-1 active:scale-95"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Limpiar Caché y Sincronizar
                            </button>
                        </div>

                        {isAdmin && (
                            <button
                                onClick={() => {
                                    setIsAdminOpen(true)
                                    setIsOpen(false)
                                }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition-all text-[9px] font-bold uppercase tracking-widest text-center mb-1 active:scale-95 border border-slate-100 bg-slate-50/50"
                            >
                                <Users className="w-3.5 h-3.5" /> Admin: Usuarios
                            </button>
                        )}

                        <div className="p-4 pt-2 text-center">
                            <button
                                onClick={() => signOut()}
                                className="w-full bg-red-50 text-red-600 font-bold py-2 rounded-xl text-sm"
                            >
                                Cerrar Sesión
                            </button>
                        </div>


                        <button
                            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest text-center active:scale-95 border border-transparent hover:border-red-100"
                        >
                            <LogOut className="w-3.5 h-3.5" /> Salir
                        </button>
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
