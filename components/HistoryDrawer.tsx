'use client'

import { useState, useMemo } from 'react'
import { format, isToday, isWithinInterval, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { X, ArrowUpRight, ArrowDownRight, Coffee, ShoppingBag, Utensils, PiggyBank, Trash2 } from 'lucide-react'
import { Movement } from '@/lib/db'
import { deleteMovement } from '@/app/actions/fund-actions'
import { CurrencyText } from './CurrencyText'
import { useLocaleContext } from './LocaleContext'

interface HistoryDrawerProps {
    isOpen: boolean
    onClose: () => void
    movements: Movement[]
    isPrivate: boolean
    isPremium: boolean
}

type Period = 'today' | 'week' | 'month' | 'all'

export function HistoryDrawer({ isOpen, onClose, movements, isPrivate, isPremium }: HistoryDrawerProps) {
    const { t } = useLocaleContext()
    const now = new Date()
    const [startDate, setStartDate] = useState(format(startOfMonth(now), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(format(now, 'yyyy-MM-dd'))

    const filteredMovements = useMemo(() => {
        try {
            // Crear fechas locales desde los strings YYYY-MM-DD
            const [sYear, sMonth, sDay] = startDate.split('-').map(Number)
            const [eYear, eMonth, eDay] = endDate.split('-').map(Number)

            const start = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0)
            const end = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999)

            return movements.filter(m => {
                const mDate = new Date(m.date)
                return mDate >= start && mDate <= end
            })
        } catch (e) {
            console.error("[HistoryDrawer] Error filtering movements:", e)
            return movements
        }
    }, [movements, startDate, endDate])

    const totals = useMemo(() => {
        return filteredMovements.reduce((acc, m) => {
            if (m.type === 'EXPENSE') acc.expenses += m.amount
            else acc.income += m.amount
            return acc
        }, { expenses: 0, income: 0 })
    }, [filteredMovements])

    if (!isOpen) return null

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

    if (!isOpen) return null

    // Determine layout based on Premium status
    const content = isPremium ? (
        // PREMIUM TABLE LAYOUT
        <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">{t('history.title')}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-amber-200">
                                Premium View
                            </span>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredMovements.length} Movimientos</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Date Filter integrated in header for Premium */}
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none px-2 uppercase"
                        />
                        <span className="text-slate-300">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none px-2 uppercase"
                        />
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Premium Table */}
            <div className="flex-1 overflow-auto bg-slate-50/50">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Concepto</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredMovements.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-20 text-center text-slate-400">
                                    <p className="text-sm font-medium">{t('history.noMovements')}</p>
                                </td>
                            </tr>
                        ) : (
                            filteredMovements.map((m) => (
                                <tr key={m.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                {getIcon(m.type, m.description)}
                                            </div>
                                            <span className="text-sm font-black text-slate-900 truncate max-w-[200px]">{m.description}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 capitalize">
                                                {format(new Date(m.date), "d 'de' MMMM", { locale: es })}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                {format(new Date(m.date), "yyyy", { locale: es })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex flex-col items-end">
                                            <div className={`text-base font-black tracking-tight flex items-center justify-end gap-1 ${m.type === 'EXPENSE' ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {isPrivate ? (
                                                    <span className="text-slate-300">••••••</span>
                                                ) : (
                                                    <>
                                                        {m.type === 'EXPENSE' ? '-' : '+'}
                                                        <CurrencyText value={m.amount} />
                                                    </>
                                                )}
                                                {m.type === 'EXPENSE' ? <ArrowDownRight className="w-4 h-4 ml-1 opacity-50" /> : <ArrowUpRight className="w-4 h-4 ml-1 opacity-50" />}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => handleDelete(m.id, m.description)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Totals Footer for Premium */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-500">
                <span>Resumen del Período</span>
                <div className="flex gap-6">
                    <span className="flex items-center gap-2">
                        Ingresos: <span className="text-emerald-600 font-black"><CurrencyText value={totals.income} /></span>
                    </span>
                    <span className="flex items-center gap-2">
                        Gastos: <span className="text-red-600 font-black"><CurrencyText value={totals.expenses} /></span>
                    </span>
                </div>
            </div>
        </div>
    ) : (
        // FREE LIST LAYOUT (Mobile Styled)
        <div className="relative w-full max-w-md bg-white flex flex-col h-[85vh] rounded-t-[32px] md:rounded-[32px] overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{t('history.title')}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{t('history.subtitle')}</p>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                    <X className="w-5 h-5 text-slate-600" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-20">
                {/* Advanced Date Filter */}
                <div className="bg-slate-50 p-4 rounded-3xl mb-8 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">{t('history.filterByPeriod')}</p>
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase ml-1 mb-1 block">{t('history.from')}</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-atsit-blue/20"
                            />
                        </div>
                        <div className="w-4 h-[1px] bg-slate-300 mt-5"></div>
                        <div className="flex-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase ml-1 mb-1 block">{t('history.to')}</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-atsit-blue/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Totals Summary Card */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-emerald-50/50 p-4 rounded-[24px] border border-emerald-100/50">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">{t('history.income')}</p>
                        <p className="text-lg font-black text-emerald-700 tracking-tighter">
                            <CurrencyText value={totals.income} />
                        </p>
                    </div>
                    <div className="bg-red-50/50 p-4 rounded-[24px] border border-red-100/50">
                        <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mb-1">{t('history.expenses')}</p>
                        <p className="text-lg font-black text-red-700 tracking-tighter">
                            <CurrencyText value={totals.expenses} />
                        </p>
                    </div>
                </div>

                {/* Movements List */}
                <div className="space-y-4">
                    {filteredMovements.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-slate-400 text-sm font-medium">{t('history.noMovements')}</p>
                        </div>
                    ) : (
                        filteredMovements.map((m) => (
                            <div key={m.id} className="group flex items-center gap-4 py-1 border-b border-slate-50 last:border-0 pb-4">
                                <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                                    {getIcon(m.type, m.description)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-bold text-slate-900 truncate">{m.description}</p>
                                    <p className="text-[11px] text-slate-400 font-medium">
                                        {format(new Date(m.date), "EEEE d 'de' MMMM", { locale: es })}
                                    </p>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                    <div>
                                        <p className={`text-[15px] font-black tracking-tight ${m.type === 'EXPENSE' ? 'text-[#D32F2F]/80' : 'text-[#2E7D32]/80'}`}>
                                            {isPrivate ? (
                                                <span className="text-slate-300">••••••</span>
                                            ) : (
                                                <CurrencyText
                                                    value={m.amount}
                                                    prefix={m.type === 'EXPENSE' ? '-' : '+'}
                                                />
                                            )}
                                        </p>
                                        <div className="flex justify-end mt-0.5">
                                            {m.type === 'EXPENSE' ? <ArrowDownRight className="w-3 h-3 text-red-400" /> : <ArrowUpRight className="w-3 h-3 text-emerald-500" />}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(m.id, m.description)}
                                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )

    // Using createPortal for global modal behavior
    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            {content}
        </div>
    )
}
