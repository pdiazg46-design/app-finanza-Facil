"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { prismaEmprende } from "@/lib/prisma-emprende"
import { revalidatePath } from "next/cache"
import { startOfMonth, endOfMonth } from "date-fns"

export async function syncEmprendeWithdrawals() {
    try {
        const session = await auth()
        if (!session?.user?.email) return { success: false, message: 'No auth' }

        // 1. Get Finanzas User & Fund
        const finanzaUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { sharedFund: true }
        })

        if (!finanzaUser || !finanzaUser.sharedFund) return { success: false, message: 'No local fund' }

        // 2. Get Emprende User by exact same email
        const emprendeUser = await prismaEmprende.user.findUnique({
            where: { email: session.user.email }
        })

        if (!emprendeUser) return { success: false, message: 'User not found in Emprende' }

        // 3. Find Withdrawals in Emprende for current month
        const now = new Date()
        const start = startOfMonth(now)
        const end = endOfMonth(now)

        const emprendeWithdrawals = await prismaEmprende.transaction.findMany({
            where: {
                userId: emprendeUser.id,
                type: 'WITHDRAWAL',
                createdAt: {
                    gte: start,
                    lte: end
                }
            }
        })

        if (emprendeWithdrawals.length === 0) return { success: true, count: 0 }

        // 4. Determine which ones are missing in Finanzas Easy
        let syncedCount = 0;

        for (const withdrawal of emprendeWithdrawals) {
            // We use the Emprende transaction ID hidden in the description to prevent duplicates
            const existingMovement = await prisma.movement.findFirst({
                where: {
                    fundId: finanzaUser.sharedFund.id,
                    description: {
                        contains: `[EMP-${withdrawal.id}]`
                    }
                }
            })

            if (!existingMovement) {
                // Sync it over to Finanzas as INCOME
                await prisma.movement.create({
                    data: {
                        fundId: finanzaUser.sharedFund.id,
                        type: 'INCOME',
                        amount: withdrawal.amount,
                        category: 'Ingreso Empresarial',
                        description: `Retiro desde Emprende (${withdrawal.paymentMethod || 'CASH'}) [EMP-${withdrawal.id}]`,
                        date: withdrawal.createdAt,
                        installments: 1
                    }
                })
                syncedCount++;
            }
        }

        if (syncedCount > 0) {
            revalidatePath('/')
        }

        return { success: true, count: syncedCount }

    } catch (e: any) {
        console.error("Error in Emprende Pull Sync:", e)
        return { success: false, error: e.message }
    }
}
