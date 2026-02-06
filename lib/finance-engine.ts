/**
 * AT-SIT Finance Core Engine
 * 
 * Contiene la lógica matemática para convertir dinero en TIEMPO (Días de Libertad).
 * Basado en la premisa: Libertad = Patrimonio / Gasto Diario
 */

interface FinanceState {
    currentBalance: number;    // Saldo actual del fondo
    monthlyBurnRate: number;   // Gasto mensual promedio de la pareja
}

export type FreedomTier = 'SURVIVAL' | 'SECURITY' | 'FLEXIBILITY' | 'INDEPENDENCE' | 'ABUNDANCE';

export interface TierInfo {
    label: string;
    labelKey: string; // Translation key
    color: string;
    description: string;
    descriptionKey: string; // Translation key
    minDays: number;
}

export const TIERS: Record<FreedomTier, TierInfo> = {
    SURVIVAL: {
        label: 'En la cuerda floja',
        labelKey: 'freedom.tiers.survival',
        color: 'text-red-500',
        minDays: 0,
        description: 'Estado Crítico. No tienes suficiente respiro para el mes. El objetivo es salir de aquí rápido.',
        descriptionKey: 'freedom.tiers.survivalDesc'
    },
    SECURITY: {
        label: 'Piso Firme',
        labelKey: 'freedom.tiers.security',
        color: 'text-orange-500',
        minDays: 90,
        description: 'Tienes un colchón de 3 a 6 meses. Estás protegido ante imprevistos.',
        descriptionKey: 'freedom.tiers.securityDesc'
    },
    FLEXIBILITY: {
        label: 'Caminando solo',
        labelKey: 'freedom.tiers.flexibility',
        color: 'text-blue-500',
        minDays: 180,
        description: 'Puedes empezar a tomar decisiones sin presión inmediata.',
        descriptionKey: 'freedom.tiers.flexibilityDesc'
    },
    INDEPENDENCE: {
        label: 'Dueño de mi Tiempo',
        labelKey: 'freedom.tiers.independence',
        color: 'text-emerald-500',
        minDays: 365,
        description: '¡Felicidades! Tienes más de un año de vida asegurada.',
        descriptionKey: 'freedom.tiers.independenceDesc'
    },
    ABUNDANCE: {
        label: 'Libertad Total',
        labelKey: 'freedom.tiers.abundance',
        color: 'text-purple-600',
        minDays: 1000,
        description: 'Has alcanzado la cima. Tu tiempo hoy es 100% tuyo.',
        descriptionKey: 'freedom.tiers.abundanceDesc'
    }
};

export class FinanceEngine {

    /**
     * Calcula cuántos días de libertad financiera permite el saldo actual.
     * Fórmula: (Saldo / (GastoMensual / 30))
     */
    static calculateFreedomDays(state: FinanceState): number {
        if (state.monthlyBurnRate <= 0) return 0;

        const dailyBurn = state.monthlyBurnRate / 30;
        return Math.floor(state.currentBalance / dailyBurn);
    }

    /**
     * Calcula un Burn Rate móvil ponderado.
     * Útil para suavizar meses atípicos y dar una visión más realista.
     * @param monthlyExpenses Array de gastos mensuales recientes
     */
    static calculateMovingBurnRate(monthlyExpenses: number[]): number {
        if (monthlyExpenses.length === 0) return 0;

        // Damos más peso al mes más reciente (50%, 30%, 20% si hay 3 meses)
        const weights = [0.5, 0.3, 0.2];
        let totalWeight = 0;
        let weightedSum = 0;

        monthlyExpenses.slice(0, 3).forEach((expense, i) => {
            const weight = weights[i] || 0.1;
            weightedSum += expense * weight;
            totalWeight += weight;
        });

        return Math.round(weightedSum / totalWeight);
    }

    /**
     * Retorna el tier actual basado en los días de libertad.
     */
    static getTier(days: number): TierInfo {
        if (days >= TIERS.ABUNDANCE.minDays) return TIERS.ABUNDANCE;
        if (days >= TIERS.INDEPENDENCE.minDays) return TIERS.INDEPENDENCE;
        if (days >= TIERS.FLEXIBILITY.minDays) return TIERS.FLEXIBILITY;
        if (days >= TIERS.SECURITY.minDays) return TIERS.SECURITY;
        return TIERS.SURVIVAL;
    }

    /**
     * Calcula cuánto "cuesta" un gasto en términos de tiempo de vida.
     * Retorna: Cantidad de días de libertad (o fracción) que se consumen.
     */
    static calculateExpenseImpact(expenseAmount: number, monthlyBurnRate: number): number {
        if (monthlyBurnRate <= 0) return 0;

        const dailyBurn = monthlyBurnRate / 30;
        const impact = expenseAmount / dailyBurn;

        return parseFloat(impact.toFixed(4));
    }
    // ... remaining methods
}
