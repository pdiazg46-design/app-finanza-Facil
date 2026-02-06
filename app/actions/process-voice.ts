'use server'

import { revalidatePath } from 'next/cache'
import { registerExpense, addContribution, deleteMovement, getLastMovementId, updateBudget, addBudgetItem, updatePartnerInfo, getSharedFund } from './fund-actions'
import { prisma } from '@/lib/prisma'

/**
 * Normaliza texto de números y palabras a valores numéricos (Alta Precisión)
 */
function normalizeNumber(text: string): number {
    const clean = text.toLowerCase().trim()
        .replace(/\$/g, '')
        .replace(/ pesos/g, '')
        .replace(/ clp/g, '');

    const wordMap: { [key: string]: number } = {
        'un': 1, 'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
        'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
        'quince': 15, 'veinte': 20, 'treinta': 30, 'cuarenta': 40, 'cincuenta': 50,
        'cien': 100, 'ciento': 100, 'doscientos': 200, 'trescientos': 300,
        'cuatrocientos': 400, 'quinientos': 500, 'mil': 1000,
        'lucas': 1000, 'luca': 1000, 'luka': 1000, 'lukas': 1000
    };

    // Caso 1: Millones (Regex flexible para espacios)
    if (clean.match(/mill[oó]n/)) {
        const parts = clean.split(/mill[oó]nes?|palos?/);
        const basePart = parts[0].replace(/[.,\s]/g, '').trim();
        const base = wordMap[basePart] || parseFloat(basePart) || 1;
        return base * 1000000;
    }

    // Caso 2: Miles / Lucas (Regex flexible para espacios: "35 mil", "35mil", "treinta mil")
    const milMatch = clean.match(/(.*?)\s*(mil|lucas?|lukas?)/i);
    if (milMatch) {
        const basePart = milMatch[1].replace(/[.,\s]/g, '').trim();
        let base = wordMap[basePart] || parseFloat(basePart);

        // Si no capturó base pero empieza con mil/luca, es 1
        if (isNaN(base as number) || base === undefined) {
            base = (clean.startsWith('mil') || clean.startsWith('luca')) ? 1 : 0;
        }

        return (base as number) * 1000;
    }

    // Caso 3: Número directo con formato chileno (35.000)
    const clpFormat = clean.replace(/\./g, '');
    const onlyDigits = clpFormat.replace(/[^\d]/g, '');
    return parseInt(onlyDigits) || 0;
}

/**
 * Extrae número de cuotas del texto
 */
function extractInstallments(text: string): number {
    // "40 cuotas", "12 meses", "3 cuotas"
    const match = text.match(/(\d+|un|dos|tres|cuatro|cinco|seis|diez|doce|quince|veinte|veinticuatro|treinta|cuarenta)\s*(?:cuotas|meses)/i)
    if (match) return normalizeNumber(match[1])
    return 1
}

/**
 * Intelligent Engine (V2A) - Enhanced NLP v3
 */
export async function processVoiceCommand(text: string) {
    if (!text) return { success: false, error: "Texto vacío" }

    await new Promise(r => setTimeout(r, 400))
    const input = text.toLowerCase().trim()
    console.log(`[V2A-Input] "${input}"`)

    const amountMatch = input.match(/(\d+(?:[.,\s]*\d+)*(?:\s*(?:mil|millones?|lucas?|lukas?|palos?))?|\b(?:un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|cuarenta|cincuenta|cien|ciento|doscientos|quinientos)\s*(?:mil|lucas?|lukas?|pesos?|millones?)\b)/i)
    const amount = amountMatch ? normalizeNumber(amountMatch[0]) : 0

    // 1. Detección de CONFIGURACIÓN (Settings)
    if (amount > 0) {
        // Mi pareja aporta...
        if (input.includes('pareja') && (input.includes('aporta') || input.includes('puso') || input.includes('pusopal'))) {
            const fund = await getSharedFund()
            await updatePartnerInfo({ name: fund.partnerName || 'Pareja', contribution: amount })
            revalidatePath('/')
            return { success: true, type: 'CONFIG', data: { message: "Aporte de pareja actualizado" } }
        }

        // Calibra/Setea fondo a... (Acceso directo a balance real)
        if (input.includes('fondo') && (input.includes('calibra') || input.includes('setea') || input.includes('actualiza') || input.includes('pon'))) {
            const fund = await getSharedFund()
            await prisma.sharedFund.update({
                where: { id: fund.id },
                data: { balance: amount }
            })
            revalidatePath('/')
            return { success: true, type: 'CONFIG', data: { message: `Fondo calibrado a ${new Intl.NumberFormat('es-CL').format(amount)} pesos` } }
        }

        // Sube el [nombre] a...
        if (input.includes('sube') || input.includes('actualiza') || input.includes('cambia')) {
            const fund = await getSharedFund()
            const words = input.split(' ')
            const item = fund.budget.find((b: any) => words.some(w => b.name.toLowerCase().includes(w)))
            if (item) {
                await updateBudget(item.id, { amount })
                revalidatePath('/')
                return { success: true, type: 'CONFIG', data: { message: `${item.name} actualizado` } }
            }
        }

        // Agrega un gasto fijo de... (O detección por palabras clave de suscripción)
        const budgetKeywords = ['agrega', 'gasto fijo', 'suscripción', 'suscripcion', 'recurrente', 'mensual', 'concepto']
        const isBudgetIntent = budgetKeywords.some(k => input.includes(k))

        if (isBudgetIntent) {
            // --- DETECCIÓN DE CUOTAS (Specific for Budget) ---
            const installments = extractInstallments(input)

            let concept = input
                .replace(amountMatch![0], '')
                .replace(/(\d+|un|dos|tres|cuatro|cinco|seis|diez|doce|quince|veinte|veinticuatro|treinta|cuarenta)\s*(?:cuotas|meses)/gi, '') // Extract from concept
                .replace(/agrega|gasto|fijo|concepto|suscripción|suscripcion|recurrente|mensual|pesos|para|de/gi, '')
                .replace(/cuotas|meses/gi, '')
                .replace(/\s+/g, ' ')
                .trim()

            if (!concept || concept.length < 2) concept = "Nuevo Concepto"

            // Append installments context to name if > 1
            if (installments > 1) {
                concept = `${concept} (${installments} cuotas)`
            }

            // Inteligencia de Categorización y Upsert
            let type: string = 'FIXED_PAGO'
            const subKeywords = ['netflix', 'spotify', 'disney', 'amazon', 'hbo', 'suscripcion', 'internet', 'celular']
            if (subKeywords.some(w => concept.toLowerCase().includes(w))) {
                type = 'SUBSCRIPTION'
            }

            const fund = await getSharedFund()
            const existingItem = fund.budget.find((b: any) =>
                b.name.toLowerCase().includes(concept.toLowerCase()) ||
                concept.toLowerCase().includes(b.name.toLowerCase())
            )

            if (existingItem) {
                await updateBudget(existingItem.id, { amount, name: concept, type, installments })
                return {
                    success: true,
                    type: 'CONFIG',
                    data: {
                        message: `Actualizado: "${existingItem.name}" ahora es de ${new Intl.NumberFormat('es-CL').format(amount)}`,
                        amount,
                        sync: true
                    }
                }
            } else {
                await addBudgetItem(concept, amount, type, installments)
                return {
                    success: true,
                    type: 'CONFIG',
                    data: {
                        message: `Concepto "${concept}" agregado como ${type === 'SUBSCRIPTION' ? 'Suscripción' : 'Pago Fijo'}`,
                        amount,
                        sync: true
                    }
                }
            }
        }
    }

    // 2. Detección de BORRADO (Súper Prioridad)
    const deleteKeywords = ['borra', 'elimina', 'quita', 'borrar', 'eliminar', 'quitar']
    const hasDeleteVerb = deleteKeywords.some(v => input.includes(v))

    if (hasDeleteVerb) {
        if (input.includes('último') || input.includes('ultimo')) {
            const lastId = await getLastMovementId()
            if (lastId) {
                await deleteMovement(lastId)
                revalidatePath('/')
                return { success: true, type: 'DELETE', data: { id: lastId, description: "Último movimiento" } }
            } else {
                return { success: false, error: "No hay movimientos para borrar." }
            }
        }
    }

    // 3. Detección de APORTE (Prioritaria)
    const contributionKeywords = ['abone', 'puse', 'aporte', 'agregue', 'agrego', 'sume', 'deposite', 'cargue', 'ingreso', 'abono', 'abonó', 'sumar', 'sumé']
    const hasContributionVerb = contributionKeywords.some(v => input.includes(v))
    const isFundMentioned = input.includes('al fondo') || input.includes('mi fondo') || input.includes('nuestro fondo') || input.includes('al común')

    if (amount > 0) {
        // Decisión: ¿Es aporte o gasto?
        if (hasContributionVerb || isFundMentioned) {
            await addContribution(amount, 'user-demo')
            revalidatePath('/')
            return { success: true, type: 'CONTRIBUTION', data: { amount } }
        } else {
            // --- DETECCIÓN DE CUOTAS ---
            const installments = extractInstallments(input)

            // Limpieza agresiva de descripción
            const description = input
                .replace(amountMatch ? amountMatch[0] : '', '') // Use amountMatch if it exists
                .replace(/(\d+|un|dos|tres|cuatro|cinco|seis|diez|doce|quince|veinte|veinticuatro|treinta|cuarenta)\s*(?:cuotas|meses)/gi, '') // Remove installment phrase
                .replace(/cuotas|meses/gi, '') // Clean leftover words
                .replace(/pesos?/gi, '')
                .replace(/en |por |de |compré |gaste |pagué |pago |para |un |una /gi, ' ')
                .replace(/\s+/g, ' ')
                .trim()

            // INTELIGENCIA DE VÍNCULO (V2A-Sync)
            const fund = await getSharedFund()
            const existingBudgetItem = fund.budget.find((b: any) =>
                description.toLowerCase().includes(b.name.toLowerCase()) ||
                b.name.toLowerCase().includes(description.toLowerCase())
            )

            let syncMessage = ""
            if (existingBudgetItem) {
                await updateBudget(existingBudgetItem.id, { amount })
                syncMessage = ` (Presupuesto de ${existingBudgetItem.name} actualizado)`
            } else {
                // AUTO-DISCOVERY: Si parece recurrente, lo agregamos al presupuesto
                // Added household utilities as requested by user's new flow
                const subKeywords = ['netflix', 'spotify', 'disney', 'amazon', 'hbo', 'suscripcion', 'internet', 'celular', 'arriendo', 'dividendo', 'seguro', 'gimnasio', 'gym', 'luz', 'agua', 'gas', 'gasto comun', 'gastos comunes']
                const isRecurringCandidate = subKeywords.some(w => description.toLowerCase().includes(w)) ||
                    input.includes('mensual') || input.includes('suscripción')

                if (isRecurringCandidate) {
                    let type: string = 'FIXED_PAGO'
                    // For variable services, we might want to default to VARIABLE_SERVICE if it matches utility keywords
                    // But current logic defaults to FIXED_PAGO or SUBSCRIPTION.
                    // Let's refine the type detection.

                    if (['netflix', 'spotify', 'disney', 'amazon', 'hbo', 'suscripcion'].some(w => description.toLowerCase().includes(w))) {
                        type = 'SUBSCRIPTION'
                    } else if (['luz', 'agua', 'gas', 'gasto comun', 'gastos comunes', 'celular'].some(w => description.toLowerCase().includes(w))) {
                        type = 'VARIABLE_SERVICE'
                    }

                    await addBudgetItem(description.charAt(0).toUpperCase() + description.slice(1), amount, type)
                    syncMessage = ` (Aprendido como ${type === 'VARIABLE_SERVICE' ? 'Servicio Variable' : type === 'SUBSCRIPTION' ? 'Suscripción' : 'Gasto Fijo'} ✨)`
                }
            }

            const result = await registerExpense({
                description: description.charAt(0).toUpperCase() + description.slice(1),
                amount,
                installments,
                category: existingBudgetItem ? existingBudgetItem.type : 'General'
            })
            revalidatePath('/')
            return {
                success: true,
                type: 'EXPENSE',
                data: { description, amount, impact: result.impact, message: syncMessage }
            }
        }
    }

    return {
        success: false,
        error: `No logré entender el monto en "${text}".`
    }
}
