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
                        budget: true,
                        // Sacamos assets de aquí para hacerlo resiliente
                        movements: {
                            orderBy: { date: 'desc' },
                            take: 100
                        }
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
                    budget: true,
                    movements: true
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

        // 🎯 ACTUALIZAR CUOTAS AUTOMÁTICAMENTE
        const now = new Date()
        const budgetUpdates: Promise<any>[] = []

        for (const item of fund.budget) {
            if (item.installments && item.installments > 1 && item.installmentStartDate) {
                const monthsElapsed = getMonthsDifference(item.installmentStartDate, now)
                const newCurrentInstallment = Math.min(monthsElapsed + 1, item.installments)

                if (newCurrentInstallment !== (item.currentInstallment || 1)) {
                    budgetUpdates.push(
                        prisma.budgetItem.update({
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
        prisma.movement.create({
            data: {
                type: 'EXPENSE',
                description: data.description,
                amount: data.amount,
                installments: data.installments || 1,
                category: data.category || 'General',
                fundId: fund.id
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
        prisma.movement.create({
            data: {
                type: 'CONTRIBUTION',
                description: 'Aporte al Fondo',
                amount: amount,
                installments: 1,
                category: 'Aporte',
                fundId: fund.id
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
    const movement = await prisma.movement.findUnique({ where: { id } })

    if (movement) {
        await prisma.$transaction([
            prisma.sharedFund.update({
                where: { id: movement.fundId },
                data: {
                    balance: movement.type === 'EXPENSE'
                        ? { increment: movement.amount }
                        : { decrement: movement.amount }
                }
            }),
            prisma.movement.delete({ where: { id } })
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
    const last = await prisma.movement.findFirst({
        orderBy: { createdAt: 'desc' }
    })
    return last ? last.id : null
}

/**
 * Agrega un nuevo concepto al presupuesto
 */
export async function addBudgetItem(name: string, amount: number, type: string = 'FIXED_PAGO', installments: number = 1) {
    const fund = await getSharedFund()

    await prisma.budgetItem.create({
        data: {
            name,
            amount,
            type,
            isAutomated: type === 'VARIABLE_SERVICE',
            installments: installments,
            currentInstallment: 1,
            fundId: fund.id
        }
    })

    // Actualizar burn rate del fondo
    const budget = await prisma.budgetItem.findMany({ where: { fundId: fund.id } })
    const totalBurn = budget
        .filter((b: any) => {
            if (b.type === 'FIXED_PAGO' && b.installments && b.installments > 1) {
                return (b.currentInstallment || 1) <= b.installments
            }
            return true
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
    const item = await prisma.budgetItem.findUnique({ where: { id } })
    if (item) {
        const fundId = item.fundId
        await prisma.budgetItem.delete({ where: { id } })

        // Recalcular burn rate
        const budget = await prisma.budgetItem.findMany({ where: { fundId } })
        const totalBurn = budget
            .filter((b: any) => {
                if (b.type === 'FIXED_PAGO' && b.installments && b.installments > 1) {
                    return (b.currentInstallment || 1) <= b.installments
                }
                return true
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
    const item = await prisma.budgetItem.findUnique({ where: { id } })
    if (item) {
        await prisma.budgetItem.update({
            where: { id },
            data: {
                amount: data.amount,
                name: data.name,
                type: data.type,
                isAutomated: data.isAutomated,
                installments: data.installments,
                currentInstallment: data.currentInstallment
            }
        })

        // Recalcular burn rate
        const budget = await prisma.budgetItem.findMany({ where: { fundId: item.fundId } })
        const totalBurn = budget
            .filter((b: any) => {
                if (b.type === 'FIXED_PAGO' && b.installments && b.installments > 1) {
                    return (b.currentInstallment || 1) <= b.installments
                }
                return true
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
            if (item.action === 'CREATE') {
                await tx.budgetItem.create({
                    data: {
                        name: item.name,
                        amount: item.amount,
                        type: item.type,
                        isAutomated: item.type === 'VARIABLE_SERVICE',
                        installments: item.installments || 1,
                        currentInstallment: item.currentInstallment || 1,
                        fundId: fund.id
                    }
                })
            } else if (item.action === 'UPDATE') {
                await tx.budgetItem.update({
                    where: { id: item.id },
                    data: {
                        name: item.name,
                        amount: item.amount,
                        installments: item.installments,
                        currentInstallment: item.currentInstallment
                    }
                })
            } else if (item.action === 'DELETE') {
                await tx.budgetItem.delete({
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
    const updatedBudget = await prisma.budgetItem.findMany({ where: { fundId: fund.id } })
    const totalBurn = updatedBudget
        .filter((b: any) => {
            // Solo incluimos en el gasto mensual si no es un pago fijo terminado
            if (b.type === 'FIXED_PAGO' && b.installments && b.installments > 1) {
                return (b.currentInstallment || 1) <= b.installments
            }
            return true
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

    // Auto-migrate: Ensure all variable services are automated
    await prisma.budgetItem.updateMany({
        where: { fundId, type: 'VARIABLE_SERVICE', isAutomated: false },
        data: { isAutomated: true }
    })

    // Auto-Provision: Crear items estándar si se detectan movimientos pero no existen en el presupuesto
    const movements = await prisma.movement.findMany({
        where: { fundId, type: 'EXPENSE', date: { gte: ninetyDaysAgo } }
    });

    const standardServices = ['Agua', 'Luz', 'Gas', 'Internet', 'Gasto Común', 'Celular'];
    const currentBudget = await prisma.budgetItem.findMany({ where: { fundId } });

    // Hito de Inteligencia 2.0: "Hot Provisioning"
    // Permitimos auto-crear un servicio estándar si:
    // 1. El usuario tiene el presupuesto vacío (usuario nuevo).
    // 2. O, si el usuario acaba de registrar un movimiento para ese servicio (últimas 48h)
    //    y el item NO existe en su presupuesto actual.
    // Esto evita recrear "items fantasma" viejos pero permite que nuevos comandos de voz funcionen de inmediato.

    const isBudgetEmpty = currentBudget.length === 0;
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    for (const service of standardServices) {
        const serviceNormalized = normalizeString(service, true);
        const exists = currentBudget.some(bi => normalizeString(bi.name, true).includes(serviceNormalized));

        if (!exists) {
            // Buscamos movimientos: o cualquiera si está vacío, o solo recientes si ya tiene presupuesto
            const hasMatches = movements.some(m => {
                const descNormalized = normalizeString(m.description, true);
                const isMatch = descNormalized.includes(serviceNormalized);

                if (isBudgetEmpty) return isMatch;
                // Si no está vacío, solo auto-creamos si el movimiento es muy reciente (Hot Provisioning)
                return isMatch && new Date(m.date) >= fortyEightHoursAgo;
            });

            if (hasMatches) {
                await prisma.budgetItem.create({
                    data: {
                        name: service,
                        amount: 0,
                        type: 'VARIABLE_SERVICE',
                        isAutomated: true,
                        fundId: fundId
                    }
                });
            }
        }
    }

    const relevantMovements = await prisma.movement.findMany({
        where: {
            fundId,
            type: 'EXPENSE',
            date: { gte: ninetyDaysAgo }
        }
    })

    const budgetItems = await prisma.budgetItem.findMany({
        where: { fundId, type: 'VARIABLE_SERVICE', isAutomated: true }
    })

    for (const item of budgetItems) {
        const itemName = normalizeString(item.name, true)
        const matches = relevantMovements.filter((m: any) => {
            const desc = normalizeString(m.description, true)
            // Matching agresivo: Coincidencia total, parcial o por palabras clave significativas
            if (desc.includes(itemName) || itemName.includes(desc)) return true;

            const itemWords = itemName.split(/\s+/).filter(w => w.length >= 3);
            const descWords = desc.split(/\s+/).filter(w => w.length >= 3);

            return itemWords.some(iw => descWords.includes(iw)) ||
                descWords.some(dw => itemWords.includes(dw));
        })

        if (matches.length > 0) {
            const total = matches.reduce((sum: number, m: any) => sum + m.amount, 0)

            // Lógica Proactiva: Dividimos por los meses en que REALMENTE hubo registros
            // Esto es más intuitivo para el usuario que promediar por la edad del fondo
            const distinctMonths = new Set(matches.map((m: any) => {
                const date = new Date(m.date);
                return `${date.getFullYear()}-${date.getMonth()}`;
            })).size;

            const monthsToDivide = Math.max(1, distinctMonths);
            const average = Math.floor(total / monthsToDivide)

            if (item.amount !== average) {
                await prisma.budgetItem.update({
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

    // Ejecutamos motor de promedios
    await calculateVariableAverages(fund.id)

    // Recargar presupuesto actualizado
    const budget = await prisma.budgetItem.findMany({ where: { fundId: fund.id } })
    const totalBurn = budget
        .filter((b: any) => {
            if (b.type === 'FIXED_PAGO' && b.installments && b.installments > 1) {
                return (b.currentInstallment || 1) <= b.installments
            }
            return true
        })
        .reduce((sum: number, b: any) => sum + b.amount, 0)

    // Aseguramos que el burn rate esté al día
    if (fund.monthlyBurnRate !== totalBurn) {
        await prisma.sharedFund.update({
            where: { id: fund.id },
            data: { monthlyBurnRate: totalBurn }
        })
    }

    // Calculamos gastos de este mes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const movements = await prisma.movement.findMany({
        where: {
            fundId: fund.id,
            date: { gte: startOfMonth }
        }
    })

    const actualMonthExpenses = movements
        .filter((m: any) => m.type === 'EXPENSE')
        .reduce((sum: number, m: any) => sum + m.amount, 0)

    // Días de libertad - INTEGRACIÓN DE INVERSIONES COMO RESPALDO LÍQUIDO
    const liquidAssets = (fund as any).assets
        ?.filter((a: any) => a.type === 'INVESTMENT')
        ?.reduce((sum: number, a: any) => sum + a.value, 0) || 0;

    const dailyBurnRate = totalBurn > 0 ? totalBurn / 30 : 1;
    const calculatedFreedomDays = Math.floor((fund.balance + fund.totalSavings + liquidAssets) / dailyBurnRate);

    // Cálculo de Deuda Total (Pasivos Fijos con cuotas restantes)
    const totalDebt = budget
        .filter((b: any) => b.type === 'FIXED_PAGO' && b.installments && b.installments > 1)
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
            budget,
            movements: await prisma.movement.findMany({
                where: { fundId: fund.id },
                orderBy: { date: 'desc' }
            })
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
