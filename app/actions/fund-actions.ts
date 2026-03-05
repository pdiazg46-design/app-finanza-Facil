'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Helper function to calculate months difference
function getMonthsDifference(start: Date, end: Date): number {
    return (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth())
}

/**
 * Obtiene el Fondo Común del usuario actual autenticado
 */
export async function getSharedFund() {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            console.error("[getSharedFund] No session or email found")
            throw new Error('No autenticado')
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                sharedFund: {
                    include: {
                        budget: true
                    }
                }
            }
        })

        if (!user) {
            console.error(`[getSharedFund] User not found in DB for email: ${session.user.email}`)
            // En teoría Auth.js + PrismaAdapter debería haberlo creado, pero si falla...
            throw new Error("Usuario no encontrado en la base de datos.")
        }

        if (!user.sharedFund) {
            console.log(`[getSharedFund] Creating new fund for user: ${user.id}`)
            // If no shared fund exists, create one for the user
            const newFund = await prisma.sharedFund.create({
                data: {
                    userId: user.id,
                    name: `Fondo de ${user.name || 'Pareja'}`,
                    balance: 0,
                    monthlyBurnRate: 0,
                    totalSavings: 0,
                    partnerName: "Pareja",
                    partnerContribution: 0
                },
                include: {
                    budget: true
                }
            })

            // Return early with new fund
            return {
                ...newFund,
                assets: [], // Default vacío
                fund: {
                    balance: newFund.balance,
                    monthlyBurnRate: newFund.monthlyBurnRate,
                    totalSavings: newFund.totalSavings,
                    partnerName: newFund.partnerName,
                    partnerContribution: newFund.partnerContribution
                }
            }
        }

        const fund = user.sharedFund

        // 🎯 CARGAR ACTIVOS DE FORMA SEGURA (Resiliente a falta de tabla en prod)
        let assets: any[] = []
        try {
            // Intentamos cargar activos por separado
            assets = await (prisma as any).asset.findMany({
                where: { fundId: fund.id }
            })
        } catch (assetError: any) {
            console.warn("[getSharedFund] Warning: Could not load assets table. Skipping.", assetError?.message || assetError)
            // No bloqueamos el inicio por esto
        }

        // 🎯 [DESACTIVADO - Requerimiento Patricio] ACTUALIZAR CUOTAS AUTOMÁTICAMENTE
        // El avance por fecha se elimina. Las cuotas ahora solo avanzarán si el usuario reporta el pago de forma manual.
        /*
        const now = new Date()
        const budgetUpdates: Promise<any>[] = []

        for (const item of fund.budget) {
            if (item.installments && item.installments > 1 && item.date) {
                const monthsElapsed = getMonthsDifference(item.date, now)
                const newCurrentInstallment = Math.min(monthsElapsed + 1, item.installments)

                if (newCurrentInstallment !== (item.currentInstallment || 1)) {
                    budgetUpdates.push(
                        prisma.transaction.update({
                            where: { id: item.id },
                            data: { currentInstallment: newCurrentInstallment }
                        })
                    )
                }
            }
        }

        if (budgetUpdates.length > 0) {
            console.log(`[getSharedFund] Updating ${budgetUpdates.length} budget items`)
            await Promise.all(budgetUpdates)
            return getSharedFund()
        }
        */

        return {
            ...fund,
            assets, // Añadimos los activos cargados de forma segura
            fund: {
                balance: fund.balance,
                monthlyBurnRate: fund.monthlyBurnRate,
                totalSavings: fund.totalSavings,
                partnerName: fund.partnerName,
                partnerContribution: fund.partnerContribution
            }
        }
    } catch (error) {
        console.error("[getSharedFund] CRITICAL ERROR:", error)
        throw error
    }
}

/**
 * Registra un nuevo gasto persistente con cálculo de impacto
 */
export async function registerExpense(data: { description: string, amount: number, installments?: number, category?: string }) {
    const fund = await getSharedFund()

    // Cálculo de impacto en días de libertad (Pepito Grillo)
    const dailyBurnRate = fund.monthlyBurnRate > 0 ? fund.monthlyBurnRate / 30 : 1;
    const daysLost = Math.floor(data.amount / dailyBurnRate);

    await prisma.$transaction([
        prisma.sharedFund.update({
            where: { id: fund.id },
            data: { balance: { decrement: data.amount } }
        }),
        prisma.transaction.create({
            data: {
                name: data.description,
                type: 'VARIABLE_EXPENSE',
                amount: data.amount,
                installments: data.installments || 1,
                currentInstallment: 1, // Start at 1
                category: data.category || 'General',
                fundId: fund.id,
                date: new Date()
            }
        })
    ])

    revalidatePath('/')
    return { success: true, impact: daysLost }
}

/**
 * Registra un nuevo aporte persistente
 */
export async function addContribution(amount: number, userId: string) {
    const fund = await getSharedFund()

    await prisma.$transaction([
        prisma.sharedFund.update({
            where: { id: fund.id },
            data: { balance: { increment: amount } }
        }),
        prisma.transaction.create({
            data: {
                name: 'Aporte al Fondo',
                type: 'INCOME',
                amount: amount,
                installments: 1,
                currentInstallment: 1,
                category: 'Aporte',
                fundId: fund.id,
                date: new Date()
            }
        })
    ])

    revalidatePath('/')
    return { success: true }
}

/**
 * Elimina un movimiento y revierte su impacto en el balance
 */
export async function deleteMovement(id: string) {
    const trx = await prisma.transaction.findUnique({ where: { id } })

    if (trx) {
        await prisma.$transaction([
            prisma.sharedFund.update({
                where: { id: trx.fundId },
                data: {
                    balance: (trx.type === 'VARIABLE_EXPENSE' || trx.type === 'FIXED_EXPENSE' || trx.type === 'INSTALLMENT_DEBT')
                        ? { increment: trx.amount }
                        : { decrement: trx.amount }
                }
            }),
            prisma.transaction.delete({ where: { id } })
        ])

        revalidatePath('/')
        return { success: true }
    }

    return { success: false, error: "Movimiento no encontrado" }
}

/**
 * Obtiene el ID del último movimiento registrado
 */
export async function getLastMovementId() {
    const last = await prisma.transaction.findFirst({
        where: { type: { in: ['INCOME', 'VARIABLE_EXPENSE'] } }, // Filtra solo transacciones per-se, no deudas
        orderBy: { createdAt: 'desc' }
    })
    return last ? last.id : null
}

/**
 * Agrega un nuevo concepto al presupuesto
 */
export async function addBudgetItem(name: string, amount: number, type: string = 'FIXED_EXPENSE', installments: number = 1) {
    const fund = await getSharedFund()
    const finalType = installments > 1 ? 'INSTALLMENT_DEBT' : type;

    await prisma.transaction.create({
        data: {
            name,
            amount,
            type: finalType, // Cast to INSTALLMENT_DEBT si hay +1 cuotas
            isAutomated: true,
            installments: installments,
            currentInstallment: 1,
            fundId: fund.id,
            date: new Date()
        }
    })

    // Actualizar burn rate del fondo
    const budget = await prisma.transaction.findMany({ where: { fundId: fund.id } })
    const totalBurn = budget
        .filter((b: any) => {
            if (b.type === 'INSTALLMENT_DEBT' && b.installments && b.installments > 1) {
                return (b.currentInstallment || 1) <= b.installments
            }
            return b.type === 'FIXED_EXPENSE' || b.type === 'INSTALLMENT_DEBT' || (b.type === 'VARIABLE_EXPENSE' && b.isAutomated === true)
        })
        .reduce((sum: number, b: any) => sum + b.amount, 0)

    await prisma.sharedFund.update({
        where: { id: fund.id },
        data: { monthlyBurnRate: totalBurn }
    })

    revalidatePath('/')
    return { success: true }
}

/**
 * Elimina un concepto del presupuesto
 */
export async function removeBudgetItem(id: string) {
    const item = await prisma.transaction.findUnique({ where: { id } })
    if (item) {
        const fundId = item.fundId
        await prisma.transaction.delete({ where: { id } })

        // Recalcular burn rate
        const budget = await prisma.transaction.findMany({ where: { fundId } })
        const totalBurn = budget
            .filter((b: any) => {
                if (b.type === 'INSTALLMENT_DEBT' && b.installments && b.installments > 1) {
                    return (b.currentInstallment || 1) <= b.installments
                }
                return b.type === 'FIXED_EXPENSE' || b.type === 'INSTALLMENT_DEBT' || (b.type === 'VARIABLE_EXPENSE' && b.isAutomated === true)
            })
            .reduce((sum: number, b: any) => sum + b.amount, 0)

        await prisma.sharedFund.update({
            where: { id: fundId },
            data: { monthlyBurnRate: totalBurn }
        })

        revalidatePath('/')
        return { success: true }
    }
    return { success: false }
}

/**
 * Actualiza un item del presupuesto
 */
export async function updateBudget(id: string, data: { amount: number, name?: string, type?: any, isAutomated?: boolean, installments?: number, currentInstallment?: number }) {
    const item = await prisma.transaction.findUnique({ where: { id } })
    if (item) {

        // Auto-cast a Deuda si le ponen más de 1 cuota
        let finalType = data.type !== undefined ? data.type : item.type;
        if (data.installments && data.installments > 1 && finalType === 'FIXED_EXPENSE') {
            finalType = 'INSTALLMENT_DEBT';
        }

        await prisma.transaction.update({
            where: { id },
            data: {
                amount: data.amount,
                name: data.name,
                type: finalType,
                isAutomated: data.isAutomated,
                installments: data.installments,
                currentInstallment: data.currentInstallment
            }
        })

        // Recalcular burn rate
        const budget = await prisma.transaction.findMany({ where: { fundId: item.fundId } })
        const totalBurn = budget
            .filter((b: any) => {
                if (b.type === 'INSTALLMENT_DEBT' && b.installments && b.installments > 1) {
                    return (b.currentInstallment || 1) <= b.installments
                }
                return b.type === 'FIXED_EXPENSE' || b.type === 'INSTALLMENT_DEBT' || (b.type === 'VARIABLE_EXPENSE' && b.isAutomated === true)
            })
            .reduce((sum: number, b: any) => sum + b.amount, 0)

        await prisma.sharedFund.update({
            where: { id: item.fundId },
            data: { monthlyBurnRate: totalBurn }
        })

        revalidatePath('/')
        return { success: true }
    }
    return { success: false }
}

/**
 * Actualiza información de la pareja
 */
export async function updatePartnerInfo(data: { name: string, contribution: number }) {
    const fund = await getSharedFund()
    await prisma.sharedFund.update({
        where: { id: fund.id },
        data: {
            partnerName: data.name,
            partnerContribution: data.contribution
        }
    })
    revalidatePath('/')
    return { success: true }
}
/**
 * Sincronización masiva de presupuesto (Evita race conditions de revalidatePath)
 */
export async function syncFullBudget(
    items: {
        id: string,
        name: string,
        amount: number,
        type: string,
        action: 'CREATE' | 'UPDATE' | 'DELETE',
        installments?: number,
        currentInstallment?: number
    }[],
    partnerInfo?: { name: string, contribution: number },
    assetItems?: {
        id: string,
        name: string,
        value: number,
        type: string,
        action: 'CREATE' | 'UPDATE' | 'DELETE'
    }[]
) {
    const fund = await getSharedFund()
    const results = []

    // 1. Procesar Partner Info si viene
    if (partnerInfo) {
        await prisma.sharedFund.update({
            where: { id: fund.id },
            data: {
                partnerName: partnerInfo.name,
                partnerContribution: partnerInfo.contribution
            }
        })
    }

    // 2. Procesar Items en orden - USANDO TRANSACCIÓN PARA ATOMICIDAD
    await prisma.$transaction(async (tx) => {
        for (const item of items) {

            // Auto-cast a Deuda si supera 1 cuota
            const finalType = (item.installments && item.installments > 1 && item.type === 'FIXED_EXPENSE')
                ? 'INSTALLMENT_DEBT'
                : item.type;

            if (item.action === 'CREATE') {
                await tx.transaction.create({
                    data: {
                        name: item.name,
                        amount: item.amount,
                        type: finalType,
                        isAutomated: true,
                        installments: item.installments || 1,
                        currentInstallment: item.currentInstallment || 1,
                        fundId: fund.id,
                        date: new Date()
                    }
                })
            } else if (item.action === 'UPDATE') {
                await tx.transaction.update({
                    where: { id: item.id },
                    data: {
                        name: item.name,
                        amount: item.amount,
                        type: finalType,
                        installments: item.installments,
                        currentInstallment: item.currentInstallment
                    }
                })
            } else if (item.action === 'DELETE') {
                await tx.transaction.delete({
                    where: { id: item.id }
                })
            }
        }

        // 3. Procesar Activos si vienen (dentro de la misma transacción)
        if (assetItems && assetItems.length > 0) {
            for (const asset of assetItems) {
                if (asset.action === 'CREATE') {
                    await (tx as any).asset.create({
                        data: {
                            name: asset.name,
                            value: asset.value,
                            type: asset.type,
                            fundId: fund.id
                        }
                    })
                } else if (asset.action === 'UPDATE') {
                    await (tx as any).asset.update({
                        where: { id: asset.id },
                        data: {
                            name: asset.name,
                            value: asset.value,
                            type: asset.type
                        }
                    })
                } else if (asset.action === 'DELETE') {
                    await (tx as any).asset.delete({
                        where: { id: asset.id }
                    })
                }
            }
        }
    })

    // 4. Recalcular Burn Rate Total una sola vez - FILTRANDO ITEMS TERMINADOS
    const updatedBudget = await prisma.transaction.findMany({ where: { fundId: fund.id } })
    const totalBurn = updatedBudget
        .filter((b: any) => {
            // Solo incluimos en el gasto mensual si no es un pago fijo terminado
            if (b.type === 'INSTALLMENT_DEBT' && b.installments && b.installments > 1) {
                return (b.currentInstallment || 1) <= b.installments
            }
            return b.type === 'FIXED_EXPENSE' || b.type === 'INSTALLMENT_DEBT' || (b.type === 'VARIABLE_EXPENSE' && b.isAutomated === true)
        })
        .reduce((sum: number, b: any) => sum + b.amount, 0)

    await prisma.sharedFund.update({
        where: { id: fund.id },
        data: { monthlyBurnRate: totalBurn }
    })

    revalidatePath('/')
    return { success: true }
}

/**
 * Normaliza strings para comparación (remueve acentos, minúsculas, espacios y palabras administrativas)
 */
function normalizeString(str: string, deepClean: boolean = false): string {
    let clean = str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
        .replace(/[^a-z0-9\s]/g, "") // Solo alfanuméricos y espacios
        .trim();

    if (deepClean) {
        const filters = ['pago', 'pagos', 'cuenta', 'cuentas', 'de', 'la', 'el', 'los', 'las', 'servicios', 'servicio'];
        clean = clean.split(/\s+/).filter(w => !filters.includes(w)).join(' ');
    }
    return clean;
}

/**
 * Motor de Inteligencia: Calcula promedios de gastos variables basados en historial (90 días)
 */
async function calculateVariableAverages(fundId: string) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Auto-migrate eliminado para evitar transformar pagos reales en plantillas

    // Auto-Provision: Crear items estándar si se detectan movimientos pero no existen en el presupuesto
    const movements = await prisma.transaction.findMany({
        where: { fundId, type: 'VARIABLE_EXPENSE', isAutomated: false, date: { gte: ninetyDaysAgo } }
    });

    const standardServices = ['Agua', 'Luz', 'Gas', 'Internet', 'Gasto Común', 'Celular'];
    const currentBudget = await prisma.transaction.findMany({ where: { fundId, type: 'VARIABLE_EXPENSE', isAutomated: true } });

    // Hito de Inteligencia 2.0: "Hot Provisioning"

    const isBudgetEmpty = currentBudget.length === 0;
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    for (const service of standardServices) {
        const serviceNormalized = normalizeString(service, true);
        const exists = currentBudget.some(bi => normalizeString(bi.name, true).includes(serviceNormalized));

        if (!exists) {
            // Buscamos movimientos: o cualquiera si está vacío, o solo recientes si ya tiene presupuesto
            const hasMatches = movements.some(m => {
                const descNormalized = normalizeString(m.name, true); // Cambiado description -> name en Transacion
                const isMatch = descNormalized.includes(serviceNormalized);

                if (isBudgetEmpty) return isMatch;
                return isMatch && new Date(m.date) >= fortyEightHoursAgo;
            });

            if (hasMatches) {
                await prisma.transaction.create({
                    data: {
                        name: service,
                        amount: 0,
                        type: 'VARIABLE_EXPENSE',
                        isAutomated: true,
                        fundId: fundId,
                        date: new Date()
                    }
                });
            }
        }
    }

    const relevantMovements = await prisma.transaction.findMany({
        where: {
            fundId,
            type: 'VARIABLE_EXPENSE',
            isAutomated: false,
            date: { gte: ninetyDaysAgo }
        }
    })

    const budgetItems = await prisma.transaction.findMany({
        where: { fundId, type: 'VARIABLE_EXPENSE', isAutomated: true }
    })

    for (const item of budgetItems) {
        const itemName = normalizeString(item.name, true)
        const matches = relevantMovements.filter((m: any) => {
            if (m.id === item.id) return false; // Don't match the budget placeholder itself
            const desc = normalizeString(m.name, true) // Cambiado description -> name
            // Matching agresivo: Coincidencia total, parcial o por palabras clave significativas
            if (desc.includes(itemName) || itemName.includes(desc)) return true;

            const itemWords = itemName.split(/\s+/).filter(w => w.length >= 3);
            const descWords = desc.split(/\s+/).filter(w => w.length >= 3);

            return itemWords.some(iw => descWords.includes(iw)) ||
                descWords.some(dw => itemWords.includes(dw));
        })

        if (matches.length > 0) {
            const total = matches.reduce((sum: number, m: any) => sum + m.amount, 0)

            const distinctMonths = new Set(matches.map((m: any) => {
                const date = new Date(m.date);
                return `${date.getFullYear()}-${date.getMonth()}`;
            })).size;

            const monthsToDivide = Math.max(1, distinctMonths);
            const average = Math.floor(total / monthsToDivide)

            if (item.amount !== average) {
                await prisma.transaction.update({
                    where: { id: item.id },
                    data: { amount: average }
                })
            }
        }
    }
}

/**
 * Algoritmo de Libertad Financiera Dinámico con Inteligencia de Promedios
 */
export async function getFundMetrics() {
    const fund = await getSharedFund()

    // Ejecutamos motor de promedios (ahora todo está en Transaction)
    await calculateVariableAverages(fund.id)

    // Recargar presupuesto actualizado (Transacciones)
    const rawTransactions = await prisma.transaction.findMany({
        where: { fundId: fund.id },
        orderBy: { date: 'desc' }
    });

    // Filtramos las plantillas de presupuesto
    const budget = rawTransactions.filter((b: any) =>
        b.isAutomated === true || b.type === 'FIXED_EXPENSE' || b.type === 'INSTALLMENT_DEBT'
    );

    // Filtramos los movimientos reales (pagos o aportes efectivos)
    const movements = rawTransactions.filter((m: any) =>
        m.isAutomated === false && (m.type === 'VARIABLE_EXPENSE' || m.type === 'INCOME')
    );

    const totalBurn = budget
        .filter((b: any) => {
            if (b.type === 'INSTALLMENT_DEBT' && b.installments && b.installments > 1) {
                return (b.currentInstallment || 1) <= b.installments
            }
            return b.type === 'FIXED_EXPENSE' || b.type === 'INSTALLMENT_DEBT' || (b.type === 'VARIABLE_EXPENSE' && b.isAutomated === true)
        })
        .reduce((sum: number, b: any) => sum + b.amount, 0)

    // Aseguramos que el burn rate esté al día
    if (fund.monthlyBurnRate !== totalBurn) {
        await prisma.sharedFund.update({
            where: { id: fund.id },
            data: { monthlyBurnRate: totalBurn }
        })
    }

    // Calculamos gastos de este mes reales (Filtrando type = 'VARIABLE_EXPENSE' desde movements)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const actualMonthExpenses = movements
        .filter((m: any) => m.type === 'VARIABLE_EXPENSE' && new Date(m.date) >= startOfMonth)
        .reduce((sum: number, m: any) => sum + m.amount, 0)

    // Días de libertad - INTEGRACIÓN DE INVERSIONES COMO RESPALDO LÍQUIDO
    const liquidAssets = (fund as any).assets
        ?.filter((a: any) => a.type === 'INVESTMENT')
        ?.reduce((sum: number, a: any) => sum + a.value, 0) || 0;

    const dailyBurnRate = totalBurn > 0 ? totalBurn / 30 : 1;
    const calculatedFreedomDays = Math.floor((fund.balance + fund.totalSavings + liquidAssets) / dailyBurnRate);

    // Cálculo de Deuda Total (Pasivos Fijos con cuotas restantes)
    const totalDebt = budget
        .filter((b: any) => b.type === 'INSTALLMENT_DEBT' && b.installments && b.installments > 1)
        .reduce((sum: number, b: any) => {
            const remainingInstallments = Math.max(0, b.installments - (b.currentInstallment - 1));
            return sum + (b.amount * remainingInstallments);
        }, 0);

    // Cálculo de Activos y Patrimonio
    const totalAssets = (fund as any).assets?.reduce((sum: number, a: any) => sum + a.value, 0) || 0;
    const netWorth = (fund.balance + fund.totalSavings + totalAssets) - totalDebt;

    // Proyecciones
    const projectedRemainingExpenses = Math.max(0, totalBurn - actualMonthExpenses);
    const disposableIncome = Math.max(0, fund.balance - projectedRemainingExpenses);

    return {
        fund: {
            ...fund,
            budget, // Solo Plantillas
            movements // Solo Movimientos Físicos Reales
        },
        freedomDays: calculatedFreedomDays,
        totalLiquidReserves: fund.balance + fund.totalSavings + liquidAssets,
        targetDays: 1000,
        projectedExpenses: projectedRemainingExpenses,
        disposableIncome,
        totalDebt,
        totalAssets,
        netWorth
    }
}

/**
 * Acciones para Activos (Patrimonio)
 */
export async function addAsset(name: string, value: number, type: string) {
    const fund = await getSharedFund()
    await (prisma as any).asset.create({
        data: {
            name,
            value,
            type,
            fundId: fund.id
        }
    })
    revalidatePath('/')
    return { success: true }
}

export async function removeAsset(id: string) {
    await (prisma as any).asset.delete({ where: { id } })
    revalidatePath('/')
    return { success: true }
}

export async function updateAsset(id: string, name: string, value: number, type: string) {
    await (prisma as any).asset.update({
        where: { id },
        data: { name, value, type }
    })
    revalidatePath('/')
    return { success: true }
}

/**
 * Registra el pago manual de una cuota o suscripción, extrayéndolo a la actividad reciente
 */
export async function registerManualPayment(transactionId: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) throw new Error("No autenticado")

        const user = await (prisma as any).user.findUnique({
            where: { email: session.user.email },
            include: { sharedFund: true }
        })

        if (!user?.sharedFund) throw new Error("No fund available")

        // 1. Encontrar la transacción base (la deuda o gasto fijo)
        const item = await (prisma as any).transaction.findUnique({
            where: { id: transactionId }
        })

        if (!item) throw new Error("Concepto no encontrado")

        // 2. Crear una transacción VARIABLE_EXPENSE inyectada a la actividad reciente
        // Esto materializa el descuento monetario de forma transparente para el usuario
        const currentInst = item.currentInstallment || 1;
        const totalInst = item.installments || 1;

        const movementName = item.type === 'INSTALLMENT_DEBT'
            ? `Pago Cuota ${Math.min(currentInst, totalInst)} de ${totalInst}: ${item.name}`
            : `Pago Mensual: ${item.name}`;

        await (prisma as any).transaction.create({
            data: {
                name: movementName,
                amount: item.amount,
                type: 'VARIABLE_EXPENSE',
                isAutomated: false,
                installments: 1,
                currentInstallment: 1,
                date: new Date(),
                category: item.category || 'Pagos',
                fundId: item.fundId
            }
        })

        // 3. Actualizar la Deuda / Gasto Fijo Original
        if (item.type === 'INSTALLMENT_DEBT') {
            if (currentInst >= totalInst) {
                // Última cuota pagada -> Eliminar la deuda original (fue saldada matemáticamente)
                await (prisma as any).transaction.delete({ where: { id: item.id } })
            } else {
                // Aún quedan cuotas -> Avanzar el contador de la cuota y mover su fecha (para recordatorios base 30 días futuro)
                await (prisma as any).transaction.update({
                    where: { id: item.id },
                    data: {
                        currentInstallment: currentInst + 1,
                        date: new Date()
                    }
                })
            }
        } else {
            // Es un FIXED_EXPENSE (suscripción continua). Solo actualizamos su fecha "fecha de último pago".
            await (prisma as any).transaction.update({
                where: { id: item.id },
                data: { date: new Date() }
            })
        }

        revalidatePath('/')
        return { success: true }
    } catch (e: any) {
        console.error("[registerManualPayment] Error:", e)
        return { success: false, error: e.message }
    }
}

/**
 * Escanea los Gastos Fijos y Deudas del usuario intentando encontrar 
 * la mejor coincidencia (Fuzzy String Match) con el comando de voz dictado,
 * para luego ejecutar su pago (materialización).
 */
export async function processVoicePaymentAction(spokenRawName: string) {
    try {
        const session = await auth()
        if (!session?.user?.email) return { success: false, error: "No autenticado" }

        const user = await (prisma as any).user.findUnique({
            where: { email: session.user.email },
            include: { sharedFund: true }
        })

        if (!user?.sharedFund) return { success: false, error: "Cuenta inactiva" }

        // Buscar cuentas fijas vivas
        const budgetItems = await (prisma as any).transaction.findMany({
            where: {
                fundId: user.sharedFund.id,
                type: { in: ['FIXED_EXPENSE', 'INSTALLMENT_DEBT'] }
            }
        });

        if (!budgetItems || budgetItems.length === 0) {
            return { success: false, error: "No tienes deudas activas" };
        }

        const cleanSpokenName = spokenRawName.toLowerCase().trim()
        const spokenWords = cleanSpokenName.split(/\s+/).filter(w => w.length > 2);

        let bestMatch = null;
        let bestScore = 0;

        for (const item of budgetItems) {
            const itemName = item.name.toLowerCase();
            let score = 0;

            if (itemName === cleanSpokenName) {
                score = 100;
            } else {
                for (const w of spokenWords) {
                    if (itemName.includes(w)) score += 10;
                }
                if (itemName.includes(cleanSpokenName)) score += 50;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = item;
            }
        }

        if (!bestMatch || bestScore < 10) {
            return { success: false, error: `No encontré deuda parecida a "${spokenRawName}"` };
        }

        // Match exitoso -> Liquidar la plata con la rutina matriz de Pago Manual
        const payResult = await registerManualPayment(bestMatch.id);

        if (payResult.success) {
            return {
                success: true,
                matchedName: bestMatch.name,
                amount: bestMatch.amount
            };
        } else {
            return { success: false, error: "Error al inyectar el cobro: " + payResult.error };
        }

    } catch (e: any) {
        console.error("[processVoicePaymentAction] Error:", e)
        return { success: false, error: "Crash al procesar el pago" }
    }
}
