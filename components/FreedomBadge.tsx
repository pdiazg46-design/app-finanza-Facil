'use client'

import { useLocaleContext } from './LocaleContext'
import { Sparkles } from 'lucide-react'

interface FreedomBadgeProps {
    days: number
}

export function FreedomBadge({ days }: FreedomBadgeProps) {
    const { t } = useLocaleContext()

    return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full shadow-md shadow-blue-500/20 border border-blue-500/50 animate-in zoom-in-95 duration-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-100" />
            <span className="text-xs font-black text-white uppercase tracking-widest leading-none pt-0.5">
                {days} {t('dimension.days')}
            </span>
        </div>
    )
}
