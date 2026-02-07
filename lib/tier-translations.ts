import { FreedomTier, TierInfo } from './finance-engine'

export function getTierTranslationKey(tier: FreedomTier): { label: string, description: string } {
    const tierMap: Record<FreedomTier, { label: string, description: string }> = {
        'SURVIVAL': { label: 'tiers.survival.label', description: 'tiers.survival.description' },
        'SECURITY': { label: 'tiers.security.label', description: 'tiers.security.description' },
        'FLEXIBILITY': { label: 'tiers.flexibility.label', description: 'tiers.flexibility.description' },
        'INDEPENDENCE': { label: 'tiers.independence.label', description: 'tiers.independence.description' },
        'ABUNDANCE': { label: 'tiers.abundance.label', description: 'tiers.abundance.description' }
    }
    return tierMap[tier]
}

export function getTierTypeFromInfo(tierInfo: TierInfo): FreedomTier {
    // Extract tier type by matching minDays
    if (tierInfo.minDays >= 1000) return 'ABUNDANCE'
    if (tierInfo.minDays >= 365) return 'INDEPENDENCE'
    if (tierInfo.minDays >= 180) return 'FLEXIBILITY'
    if (tierInfo.minDays >= 90) return 'SECURITY'
    return 'SURVIVAL'
}
