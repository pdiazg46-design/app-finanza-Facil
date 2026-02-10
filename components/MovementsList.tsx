'use client'

import { useState } from 'react'
import { format, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowUpRight, ArrowDownRight, Coffee, ShoppingBag, Utensils, PiggyBank, Trash2, Eye, EyeOff } from 'lucide-react'
import { Movement } from '@/lib/db'
import { deleteMovement } from '../app/actions/fund-actions'
import { HistoryDrawer } from './HistoryDrawer'
import { usePrivacy } from './PrivacyContext'
import { CurrencyText } from './CurrencyText'
import { useLocaleContext } from './LocaleContext'

interface MovementsListProps {
    movements: Movement[]
    isPremium: boolean
    isMobile?: boolean
}

export function MovementsList({ movements, isPremium, isMobile = false }: MovementsListProps) {
    const { t } = useLocaleContext()
    const { isPrivate, togglePrivacy } = usePrivacy()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    if (!movements || movements.length === 0) {
        return (
            <div className="mt-8 text-center px-6">
                <div className="bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-300">
                    <p className="text-[14px] text-slate-700 font-black">{t('movements.empty')}</p>
                    <p className="text-[12px] text-slate-600 mt-2 font-medium">{t('movements.emptyHint')}</p>
                </div>
            </div>
        )
    }

    const getIcon = (type: string, description: string) => {
        if (type === 'CONTRIBUTION') return <PiggyBank className="w-4 h-4 text-[#2E7D32]/60" />
        const desc = description.toLowerCase()
        if (desc.includes('comida') || desc.includes('sushi') || desc.includes('pizza') || desc.includes('almuerzo')) return <Utensils className="w-4 h-4 text-orange-500" />
        if (desc.includes('cafe') || desc.includes('starbucks')) return <Coffee className="w-4 h-4 text-amber-600" />
        return <ShoppingBag className="w-4 h-4 text-atsit-blue" />
    }

    const handleDelete = async (id: string, description: string) => {
        if (confirm(`¿Seguro que quieres borrar "${description}"?`)) {
            await deleteMovement(id)
        }
    }

    // Filtrar para asegurar que los de hoy estén arriba y visibles
    const todayMovements = movements.filter(m => isToday(new Date(m.date)))


    return (
        <div className="mt-3 px-1 pb-10">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-widest">{t('movements.recentActivity')}</h3>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        className="text-[11px] font-black text-atsit-blue bg-blue-50 px-3 py-1 rounded-full hover:bg-atsit-blue hover:text-white transition-all active:scale-95 border border-blue-100/50"
                    >
                        Ver todo
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {/* Sección Hoy (si hay movimientos) */}
                {todayMovements.length > 0 ? (
                    <>
                        <p className="text-[11px] font-black text-emerald-700 bg-emerald-100 w-fit px-3 py-0.5 rounded-full mb-3 tracking-widest">{t('movements.today')}</p>
                        {todayMovements.map((m) => (
                            <div key={m.id} className="group bg-white rounded-2xl p-3 shadow-sm border border-slate-50 flex items-center gap-3 transition-all active:scale-[0.98] relative overflow-hidden">
                                {/* Icon Container */}
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                                    {getIcon(m.type, m.description)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-black text-slate-900 truncate tracking-tight">
                                        {m.description}
                                    </p>
                                    <p className="text-[11px] text-slate-700 font-bold mt-1">
                                        {format(new Date(m.date), "HH:mm", { locale: es })}
                                        {m.installments > 1 && ` • ${m.installments} cuotas`}
                                    </p>
                                </div>

                                {/* Amount & Actions */}
                                <div className="text-right flex items-center gap-1.5">
                                    <div className="min-w-[80px]">
                                        <div className={`text-[15px] font-black tracking-tight font-[family-name:var(--font-montserrat)] ${m.type === 'EXPENSE' ? 'text-red-700' : 'text-emerald-700'}`}>
                                            <CurrencyText
                                                value={m.amount}
                                                prefix={m.type === 'EXPENSE' ? '-' : '+'}
                                            />
                                        </div>
                                        <div className="flex items-center justify-end mt-0.5">
                                            {m.type === 'EXPENSE' ? (
                                                <ArrowDownRight className="w-2.5 h-2.5 text-[#D32F2F]/60" />
                                            ) : (
                                                <ArrowUpRight className="w-2.5 h-2.5 text-[#2E7D32]/60" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <button
                                            onClick={() => handleDelete(m.id, m.description)}
                                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-sm text-slate-400 font-bold italic">
                            No hay movimientos hoy
                        </p>
                    </div>
                )}
            </div>

            <HistoryDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                movements={movements}
                isPrivate={isPrivate}
                isPremium={isPremium}
                isMobile={isMobile}
            />
        </div>
    )
}
