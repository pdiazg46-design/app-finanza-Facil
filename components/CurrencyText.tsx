'use client'

import { usePrivacy } from './PrivacyContext'
import { useSession } from 'next-auth/react'

interface CurrencyTextProps {
    value: number
    className?: string
    prefix?: string
}

export function CurrencyText({ value, className = "", prefix = "$" }: CurrencyTextProps) {
    const { isPrivate } = usePrivacy()

    const formatted = new Intl.NumberFormat('es-CL').format(value)

    if (isPrivate) {
        return <span className={`${className} select-none`}>{prefix} ••••••</span>
    }

    return <span className={className}>{prefix} {formatted}</span>
}
