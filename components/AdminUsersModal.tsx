'use client'

import { useState, useEffect } from "react"
import { getUsers, switchUserPlan } from "../app/actions/user-actions"
import { X, Users, Sparkles, Shield, Search, RefreshCw, Calendar } from "lucide-react"
import { createPortal } from "react-dom"

interface User {
    id: string
    name: string | null
    email: string | null
    image: string | null
    plan: string
    createdAt: Date
}

interface AdminUsersModalProps {
    isOpen: boolean
    onClose: () => void
}

export function AdminUsersModal({ isOpen, onClose }: AdminUsersModalProps) {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [updatingEmail, setUpdatingEmail] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            fetchUsers()
        }
    }, [isOpen])

    const fetchUsers = async () => {
        setIsLoading(true)
        const data = await getUsers()
        setUsers(data as any)
        setIsLoading(false)
    }

    const handleTogglePlan = async (email: string, currentPlan: string) => {
        setUpdatingEmail(email)
        const newPlan = currentPlan === "FREE" ? "PREMIUM" : "FREE"
        const result = await switchUserPlan(email, newPlan)
        if (result.success) {
            setUsers(users.map(u => u.email === email ? { ...u, plan: newPlan } : u))
        }
        setUpdatingEmail(null)
    }

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 leading-tight">Control de Usuarios</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredUsers.length} Registrados</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Users List */}
                {/* Users Table */}
                <div className="flex-1 overflow-auto bg-slate-50/30">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                                <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Contacto</th>
                                <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Registro</th>
                                <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Plan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                                            <RefreshCw className="w-8 h-8 animate-spin" />
                                            <p className="text-xs font-bold uppercase tracking-widest">Cargando comunidad...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-slate-400">
                                        <p className="text-sm font-medium">No se encontraron usuarios</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                        {/* Name & Avatar */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                                    {user.image ? (
                                                        <img src={user.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-black text-slate-400 uppercase">
                                                            {(user.name || user.email || "U").charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-slate-900 truncate max-w-[150px]">{user.name || 'Sin nombre'}</p>
                                                    {user.plan === 'PREMIUM' && (
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                            <span className="text-[9px] font-black text-amber-600 uppercase tracking-wide">Premium</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact (Email) */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-slate-700 select-all">{user.email}</p>
                                            </div>
                                        </td>

                                        {/* Registration Date */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-bold capitalize">
                                                    {new Date(user.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleTogglePlan(user.email!, user.plan)}
                                                disabled={updatingEmail === user.email}
                                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${user.plan === 'PREMIUM'
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                                    }`}
                                            >
                                                {updatingEmail === user.email ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Shield className="w-4 h-4" />
                                                        {user.plan === 'PREMIUM' ? 'Hacer Gratis' : 'Hacer Premium'}
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>,
        document.body
    )
}
