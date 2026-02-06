'use client'

import { LiquidityCard } from './LiquidityCard'
import { useLocaleContext } from './LocaleContext'

interface TranslatedLiquidityCardsProps {
    commonBalance: number
    disposableIncome: number
    projectedExpenses: number
}

export function TranslatedLiquidityCards({
    commonBalance,
    disposableIncome,
    projectedExpenses
}: TranslatedLiquidityCardsProps) {
    const { t } = useLocaleContext()

    return (
        <div className="grid grid-cols-2 gap-3 mt-4 mb-3">
            <LiquidityCard
                type="common"
                title={t('liquidity.available.title')}
                subtitle={t('liquidity.available.subtitle')}
                amount={commonBalance}
                projectedExpenses={projectedExpenses}
                infoContent={t('liquidity.available.info')}
                infoDescription={t('liquidity.available.description')}
            />

            <LiquidityCard
                type="disposable"
                title={t('liquidity.disposable.title')}
                subtitle={t('liquidity.disposable.subtitle')}
                amount={disposableIncome}
                infoContent={t('liquidity.disposable.info')}
                infoDescription={t('liquidity.disposable.description')}
            />
        </div>
    )
}
