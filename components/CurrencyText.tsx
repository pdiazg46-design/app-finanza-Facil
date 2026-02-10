'use client'

import { usePrivacy } from './PrivacyContext'
import { useLocaleContext } from './LocaleContext'
import { useState, useEffect } from 'react'

interface CurrencyTextProps {
    value: number
    className?: string
    prefix?: string
}

export function CurrencyText({ value, className = "", prefix = "" }: CurrencyTextProps) {
    const { isPrivate } = usePrivacy()
    const { locale } = useLocaleContext()
    const [symbol, setSymbol] = useState('$')

    useEffect(() => {
        // Read currency symbol from localStorage (set by CountrySelector)
        const savedSymbol = localStorage.getItem('at-sit-user-currency-symbol')
        if (savedSymbol) {
            setSymbol(savedSymbol)
        }
    }, [])

    // Use locale-aware formatting (handles thousand separators correctly)
    // USA: 1,000.50 | Chile/Brazil: 1.000,50
    const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value)

    if (isPrivate) {
        return <span className={`${className} select-none`}>{prefix} {symbol} ••••••</span>
    }

    return <span className={className}>{prefix} {symbol} {formatted}</span>
}
