'use server'

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function switchUserPlan(targetEmail: string, newPlan: "FREE" | "PREMIUM") {
    const session = await auth()

    // Security check: Only allow the specific admin to perform this action
    if (session?.user?.email !== "pdiazg46@gmail.com") {
        throw new Error("Unauthorized: Only the admin can switch plans.")
    }

    try {
        await prisma.user.update({
            where: { email: targetEmail },
            data: { plan: newPlan }
        })

        // Revalidate everything to ensure UI updates immediately
        revalidatePath("/", "layout")

        return { success: true, message: `Plan switched to ${newPlan}` }
    } catch (error) {
        console.error("Failed to switch plan:", error)
        return { success: false, message: "Failed to update plan" }
    }
}

export async function getUsers() {
    const session = await auth()

    // Security check: Only allow the specific admin
    if (session?.user?.email !== "pdiazg46@gmail.com") {
        throw new Error("Unauthorized")
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                plan: true,
                createdAt: true
            }
        })
        return users
    } catch (error) {
        console.error("Failed to fetch users:", error)
        return []
    }
}
