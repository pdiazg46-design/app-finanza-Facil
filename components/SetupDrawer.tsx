import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, TrendingDown, Users, DollarSign, Plus, Trash2, Zap, CreditCard, RefreshCw } from 'lucide-react'
import { syncFullBudget } from '../app/actions/fund-actions'
import { BudgetCategory, CategoryType } from '@/lib/db'
import { usePrivacy } from './PrivacyContext'
import { CurrencyText } from './CurrencyText'
import { useLocaleContext } from './LocaleContext'

interface SetupDrawerProps {
    isOpen: boolean
    onClose: () => void
    budget: BudgetCategory[]
    assets?: { id: string, name: string, value: number, type: string }[]
    partnerInfo: { name?: string, contribution?: number }
    freedomDays: number
}

export function SetupDrawer({ isOpen, onClose, budget, assets, partnerInfo, freedomDays }: SetupDrawerProps) {
    const { t } = useLocaleContext()
    const { isPrivate } = usePrivacy()
    const [localBudget, setLocalBudget] = useState<any[]>(() => {
        return budget.map(item => {
            const hasInstallmentsInName = item.name.match(/\((\d+) cuotas\)/);
            return {
                ...item,
                installments: item.installments || (hasInstallmentsInName ? parseInt(hasInstallmentsInName[1]) : 1),
                currentInstallment: item.currentInstallment || 1
            };
        });
    })
    const [localPartner, setLocalPartner] = useState({
        name: partnerInfo.name || 'Pareja',
        contribution: partnerInfo.contribution || 0
    })
    const [localAssets, setLocalAssets] = useState<any[]>(assets || [])
    const [isSaving, setIsSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingAssetId, setEditingAssetId] = useState<string | null>(null)

    // Sync state when props change (Voice updates)
    useEffect(() => {
        const enhancedBudget = budget.map(item => {
            const hasInstallmentsInName = item.name.match(/\((\d+) cuotas\)/);
            return {
                ...item,
                installments: item.installments || (hasInstallmentsInName ? parseInt(hasInstallmentsInName[1]) : 1),
                currentInstallment: item.currentInstallment || 1
            };
        });
        setLocalBudget(enhancedBudget);
    }, [budget])

    useEffect(() => {
        setLocalPartner({
            name: partnerInfo.name || 'Pareja',
            contribution: partnerInfo.contribution || 0
        })
    }, [partnerInfo])

    if (!isOpen) return null

    // Buscamos el root del mobile frame
    const portalRoot = typeof document !== 'undefined' ? document.getElementById('mobile-drawer-root') : null

    const handleAmountChange = (id: string, value: string) => {
        const amount = parseInt(value.replace(/\D/g, '')) || 0
        setLocalBudget(prev => prev.map(b => b.id === id ? { ...b, amount } : b))
    }

    const handleNameChange = (id: string, name: string) => {
        setLocalBudget(prev => prev.map(b => b.id === id ? { ...b, name } : b))
    }

    const handleAddItem = (type: CategoryType) => {
        const newItem: BudgetCategory & { installments?: number } = {
            id: 'temp-' + Math.random().toString(36).substr(2, 9),
            name: '',
            amount: 0,
            type,
            isAutomated: false, // Variable service auto-check logic relies on backend usually, default false here
            installments: 1
        }
        setLocalBudget(prev => [newItem, ...prev])
    }

    const handleRemoveItem = (id: string) => {
        if (id.startsWith('temp-')) {
            setLocalBudget(prev => prev.filter(b => b.id !== id))
        } else {
            if (confirm("¿Eliminar este concepto al guardar?")) {
                setLocalBudget(prev => prev.filter(b => b.id !== id))
            }
        }
    }

    const handleAddAsset = () => {
        const newAsset = {
            id: 'temp-asset-' + Math.random().toString(36).substr(2, 9),
            name: '',
            value: 0,
            type: 'OTHER'
        }
        setLocalAssets(prev => [newAsset, ...prev])
    }

    const handleRemoveAsset = (id: string) => {
        setLocalAssets(prev => prev.filter(a => a.id !== id))
    }

    const handleAssetChange = (id: string, field: string, value: any) => {
        setLocalAssets(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
    }

    const handleSave = async () => {
        setIsSaving(true)

        // Preparar payload masivo
        const itemsToSync = localBudget.map(item => {
            // Logic to format name with installments if present
            const finalName = item.name;
            const itemWithInstallments = item as any;

            // Determinar acción
            const basePayload = {
                id: item.id,
                name: finalName,
                amount: item.amount,
                type: item.type,
                installments: itemWithInstallments.installments || 1,
                currentInstallment: itemWithInstallments.currentInstallment || 1
            };

            if (item.id.startsWith('temp-')) {
                return { ...basePayload, action: 'CREATE' as const }
            } else {
                return { ...basePayload, action: 'UPDATE' as const }
            }
        }).filter(i => i.amount >= 0)

        // Sanitize payload: Ensure names exist
        const sanitizedPayload = itemsToSync.map(item => ({
            ...item,
            name: item.name && item.name.trim() !== '' ? item.name : 'Concepto sin nombre'
        }))

        // Detectar eliminados
        const deletedItems = budget
            .filter(serverItem => !localBudget.some(local => local.id === serverItem.id))
            .map(item => ({
                id: item.id,
                name: item.name,
                amount: item.amount,
                type: item.type,
                action: 'DELETE' as const
            }))

        const fullPayload = [...sanitizedPayload, ...deletedItems]

        // Identificar cambios en activos
        const assetActions = localAssets.map(asset => {
            if (asset.id.startsWith('temp-asset-')) {
                return { ...asset, action: 'CREATE' as const }
            }
            const original = assets?.find(a => a.id === asset.id)
            if (original && (original.name !== asset.name || original.value !== asset.value || original.type !== asset.type)) {
                return { ...asset, action: 'UPDATE' as const }
            }
            return null
        }).filter(Boolean) as any[]

        // Identificar activos eliminados
        const deletedAssets = assets?.filter(a => !localAssets.some(la => la.id === a.id))
            .map(a => ({ ...a, action: 'DELETE' as const })) || []

        const finalAssetPayload = [...assetActions, ...deletedAssets]

        try {
            await syncFullBudget(fullPayload, localPartner, finalAssetPayload)
            onClose()
        } catch (error) {
            console.error("Sync failed:", error)
            alert("Hubo un problema al guardar los cambios. Por favor intenta de nuevo.")
        } finally {
            setIsSaving(false)
        }
    }

    const totalMonthly = localBudget.reduce((sum, b) => sum + b.amount, 0)

    const categories: { type: CategoryType, label: string, icon: any }[] = [
        { type: 'FIXED_PAGO', label: 'Pagos Fijos (Arriendos, Créditos)', icon: CreditCard },
        { type: 'SUBSCRIPTION', label: 'Suscripciones', icon: Zap },
        { type: 'VARIABLE_SERVICE', label: 'Servicios Variables (Promediados)', icon: RefreshCw }
    ]

    const drawerContent = (
        <div className="absolute inset-0 h-full w-full z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300 pointer-events-auto">
            {/* Header */}
            <div className="px-6 pt-10 pb-4 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{t('setup.title')}</h2>
                    <p className="text-[12px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">{t('setup.myRealNumbers')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-all active:scale-95"
                        title="Guardar todo"
                    >
                        {isSaving ? <RefreshCw className="w-5 h-5 text-atsit-blue animate-spin" /> : <Save className="w-5 h-5 text-atsit-blue" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 bg-white">



                {/* Categorized Sections */}
                {categories.map(cat => {
                    const itemsInCategory = localBudget.filter(item => item.type === cat.type)
                    return (
                        <div key={cat.type} className="mb-10">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <cat.icon className="w-4 h-4" /> {
                                        cat.type === 'FIXED_PAGO' ? 'Deudas de Cuotas (Créditos)' :
                                            cat.type === 'SUBSCRIPTION' ? 'Gastos Hormiga (Suscripciones)' :
                                                'Cuentas por Pagar (Servicios)'
                                    }
                                    {cat.type === 'VARIABLE_SERVICE' && (
                                        <span className="ml-2 bg-blue-100 text-blue-700 text-[11px] px-2 py-0.5 rounded-full lowercase font-bold">automático</span>
                                    )}
                                </h3>
                                {cat.type !== 'VARIABLE_SERVICE' && (
                                    <button
                                        onClick={() => handleAddItem(cat.type)}
                                        className="p-1.5 px-4 bg-slate-100 text-slate-700 rounded-full text-[13px] font-black uppercase hover:bg-atsit-blue hover:text-white transition-colors border border-slate-200"
                                    >
                                        + Añadir
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {localBudget.filter(item => item.type === cat.type).map(item => {
                                    const installments = item.installments || 1
                                    const currentInstallment = item.currentInstallment || 1

                                    return (
                                        <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm relative group">
                                            {!item.isAutomated && (
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="absolute top-4 right-4 p-1 text-slate-500 hover:text-red-400 transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}

                                            <div className="space-y-3">
                                                {/* Header with name and monthly payment */}
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            placeholder="Nombre del concepto..."
                                                            value={item.name}
                                                            onChange={(e) => handleNameChange(item.id, e.target.value)}
                                                            disabled={item.isAutomated}
                                                            className={`w-full bg-transparent border-0 text-[17px] font-black text-slate-900 focus:outline-none mb-1 ${item.isAutomated ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                        />
                                                        <div className="flex items-center gap-1.5 p-2 bg-slate-50/50 rounded-xl border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all">
                                                            <div className="flex items-baseline gap-1 flex-1">
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={isPrivate ? '$ ••••••' : (editingId === item.id ? item.amount.toString() : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(item.amount))}
                                                                    onChange={(e) => handleAmountChange(item.id, e.target.value)}
                                                                    onFocus={() => !isPrivate && !item.isAutomated && setEditingId(item.id)}
                                                                    onBlur={() => setEditingId(null)}
                                                                    disabled={isPrivate || item.isAutomated}
                                                                    className={`bg-transparent border-0 p-0 text-xl font-black text-slate-900 focus:outline-none ${isPrivate || item.isAutomated ? 'cursor-not-allowed' : ''}`}
                                                                    style={{ width: `${Math.max(4, (isPrivate ? 8 : (editingId === item.id ? item.amount.toString().length : new Intl.NumberFormat('es-CL').format(item.amount).length + 2)))}ch` }}
                                                                />
                                                                <span className="text-[14px] text-slate-700 font-black uppercase tracking-tight">/ mes</span>
                                                            </div>
                                                            {editingId === item.id && (
                                                                <button
                                                                    onMouseDown={(e) => {
                                                                        e.preventDefault();
                                                                        handleSave();
                                                                    }}
                                                                    className="p-1.5 bg-blue-600 text-white rounded-lg shadow-lg animate-in zoom-in duration-200"
                                                                >
                                                                    <Save className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Installments Input for Fixed Payments */}
                                                {item.type === 'FIXED_PAGO' && (
                                                    <>
                                                        <div className="flex items-center justify-between gap-3 py-2 px-3 bg-slate-50 rounded-xl">
                                                            <span className="text-[12px] font-bold uppercase text-slate-700">Total cuotas:</span>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[12px] text-slate-600 font-bold">#</span>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max="120"
                                                                    value={installments}
                                                                    onChange={(e) => {
                                                                        const val = parseInt(e.target.value) || 1;
                                                                        setLocalBudget(prev => prev.map(b => {
                                                                            if (b.id === item.id) {
                                                                                return { ...b, installments: val }
                                                                            }
                                                                            return b
                                                                        }))
                                                                    }}
                                                                    onFocus={(e) => e.target.select()}
                                                                    className="w-12 bg-transparent border-0 p-0 text-center text-[15px] font-black text-slate-800 focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Total Debt and Independence Impact */}
                                                        <div className="flex flex-col gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[12px] font-bold uppercase text-red-700">Deuda Total:</span>
                                                                <span className="text-xl font-black text-red-700">
                                                                    {isPrivate ? '••••••' : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(item.amount * (installments - (currentInstallment - 1)))}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center pt-1.5 border-t border-red-200/50">
                                                                <span className="text-[11px] font-bold uppercase text-red-600">Peso en mi Respiro:</span>
                                                                <span className="text-[12px] font-black text-red-700">
                                                                    {isPrivate ? '---' : `${Math.round((item.amount * (installments - (currentInstallment - 1))) / Math.max(1, totalMonthly / 30))} días perdidos`}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Progress */}
                                                        {installments > 1 && (
                                                            <div>
                                                                <div className="flex items-center justify-between mb-1.5">
                                                                    <p className="text-[12px] font-bold text-slate-700">
                                                                        Cuota {currentInstallment} de {installments}
                                                                    </p>
                                                                    <p className="text-[11px] text-slate-600 font-medium">
                                                                        {Math.max(0, installments - currentInstallment + 1)} restantes
                                                                    </p>
                                                                </div>
                                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                                    <div
                                                                        className="bg-blue-500 h-full transition-all duration-300"
                                                                        style={{ width: `${(currentInstallment / installments) * 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                {item.type === 'VARIABLE_SERVICE' && (
                                                    <div className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg flex items-center gap-2">
                                                        <RefreshCw className="w-3 h-3" />
                                                        <span className="text-[9px] font-bold uppercase">Promedio Automático</span>
                                                    </div>
                                                )}
                                            </div>

                                            {item.type === 'VARIABLE_SERVICE' && (
                                                <p className="text-[8px] text-slate-400 font-medium mt-2 italic px-1">
                                                    * Se recalcula solo según el promedio de los últimos 90 días.
                                                </p>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}

                {/* Patrimonio Section */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-[13px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                            <DollarSign className="w-3.5 h-3.5" /> Bienes y Ahorros (Activos)
                        </h3>
                        <p className="text-[11px] text-blue-600 font-black uppercase italic">* Solo "Inversión" suma a Días de Respiro</p>
                        <button
                            onClick={handleAddAsset}
                            className="p-1 px-3 bg-slate-50 text-slate-600 rounded-full text-[12px] font-black uppercase hover:bg-green-50 hover:text-green-600 transition-colors border border-slate-200"
                        >
                            + Activo
                        </button>
                    </div>
                    <div className="space-y-3">
                        {localAssets.map(asset => (
                            <div key={asset.id} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 shadow-sm relative group">
                                <button
                                    onClick={() => handleRemoveAsset(asset.id)}
                                    className="absolute top-4 right-4 p-1 text-slate-500 hover:text-red-400 transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Ej: Auto, Depto, Inversiones..."
                                        value={asset.name}
                                        onChange={(e) => handleAssetChange(asset.id, 'name', e.target.value)}
                                        className="w-full bg-transparent border-0 text-sm font-bold text-slate-700 focus:outline-none mb-1"
                                    />
                                    <div className="flex items-center gap-2 p-2 bg-white/50 rounded-xl border border-slate-100 focus-within:border-blue-200 focus-within:bg-white transition-all">
                                        <div className="flex items-baseline gap-1 flex-1">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={isPrivate ? '$ ••••••' : (editingAssetId === asset.id ? asset.value.toString() : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(asset.value))}
                                                onChange={(e) => handleAssetChange(asset.id, 'value', parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                                                onFocus={() => !isPrivate && setEditingAssetId(asset.id)}
                                                onBlur={() => setEditingAssetId(null)}
                                                className="bg-transparent border-0 p-0 text-lg font-black text-slate-900 focus:outline-none"
                                                style={{ width: `${Math.max(4, (isPrivate ? 8 : (editingAssetId === asset.id ? asset.value.toString().length : new Intl.NumberFormat('es-CL').format(asset.value).length + 2)))}ch` }}
                                            />
                                        </div>
                                        {editingAssetId === asset.id && (
                                            <button
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleSave();
                                                }}
                                                className="p-1.5 bg-blue-600 text-white rounded-lg shadow-lg animate-in zoom-in duration-200"
                                            >
                                                <Save className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {['PROPERTY', 'VEHICLE', 'INVESTMENT', 'OTHER'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => handleAssetChange(asset.id, 'type', type)}
                                                className={`text-[11px] font-black px-3 py-1.5 rounded-md transition-all flex-1 min-w-[80px] text-center ${asset.type === type ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                                            >
                                                {type === 'PROPERTY' ? 'INMUEBLE' : type === 'VEHICLE' ? 'VEHÍCULO' : type === 'INVESTMENT' ? 'INVERSIÓN' : 'OTRO'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Partner Section */}
                <div className="mb-10 pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-[13px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" /> Aportes de Pareja
                        </h3>
                    </div>
                    <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-slate-200/50 flex gap-4">
                        <div className="flex-1">
                            <label className="text-[11px] font-black text-slate-600 uppercase block mb-1 ml-1">Nombre</label>
                            <input
                                type="text"
                                value={localPartner.name}
                                onChange={(e) => setLocalPartner(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900"
                            />
                        </div>
                        <div className="flex-[1.5]">
                            <label className="text-[11px] font-black text-slate-600 uppercase block mb-1 ml-1">Monto Mensual</label>
                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-blue-300 transition-all">
                                <input
                                    type="text"
                                    value={isPrivate ? '$ ••••••' : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(localPartner.contribution)}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value.replace(/\D/g, '')) || 0
                                        setLocalPartner(prev => ({ ...prev, contribution: val }))
                                    }}
                                    disabled={isPrivate}
                                    className={`bg-transparent border-0 p-0 text-lg font-black text-slate-900 focus:outline-none ${isPrivate ? 'cursor-not-allowed' : ''}`}
                                    style={{ width: `${Math.max(4, (isPrivate ? 8 : new Intl.NumberFormat('es-CL').format(localPartner.contribution).length + 2))}ch` }}
                                />
                                <span className="text-[12px] text-slate-600 font-bold uppercase tracking-tighter shrink-0">/ mes</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Global Summary */}
                <div className="bg-slate-900 rounded-3xl p-5 mb-8">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Costo de Mantención (Burn Rate)</p>
                        <p className="text-[11px] font-black text-emerald-400 uppercase tracking-tighter">Meta mensual</p>
                    </div>
                    <div className="text-2xl font-black text-white font-[family-name:var(--font-montserrat)]">
                        <CurrencyText value={totalMonthly} />
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-emerald-500 w-2/3"></div>
                    </div>
                </div>
            </div>

            {/* Action Bar - STICKY AT BOTTOM */}
            <div className="sticky bottom-0 p-6 border-t border-slate-100 bg-white z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] shrink-0">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-[#003870] text-white py-4 rounded-2xl font-black text-base uppercase tracking-widest shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    {isSaving ? 'Guardando...' : <><Save className="w-5 h-5" /> GUARDAR CAMBIOS</>}
                </button>
            </div>
        </div>
    )

    return portalRoot ? createPortal(drawerContent, portalRoot) : drawerContent
}
