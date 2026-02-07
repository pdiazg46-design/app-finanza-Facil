/**
 * Currency Formatter - Dynamic currency formatting based on user's selected country
 * 
 * This module provides centralized currency formatting that adapts to the user's
 * selected country and currency from localStorage.
 */

export interface CurrencyConfig {
    locale: string
    currency: string
    symbol: string
}

/**
 * Get currency configuration from localStorage
 * Falls back to Chilean Peso if no country is selected
 */
export function getCurrencyConfig(): CurrencyConfig {
    if (typeof window === 'undefined') {
        return { locale: 'es-CL', currency: 'CLP', symbol: '$' }
    }

    const savedCountry = localStorage.getItem('selectedCountry')
    const savedCurrency = localStorage.getItem('at-sit-user-currency')
    const savedLocale = localStorage.getItem('at-sit-user-locale')
    const savedSymbol = localStorage.getItem('at-sit-user-currency-symbol')

    return {
        locale: savedLocale || 'es-CL',
        currency: savedCurrency || 'CLP',
        symbol: savedSymbol || '$'
    }
}

/**
 * Format a number as currency using the user's selected currency
 * 
 * @param amount - The amount to format
 * @param maximumFractionDigits - Maximum decimal places (default: 0)
 * @returns Formatted currency string (e.g., "$1.234.567" or "R$ 1.234.567")
 */
export function formatCurrency(amount: number, maximumFractionDigits: number = 0): string {
    const { locale, currency } = getCurrencyConfig()

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: maximumFractionDigits
    }).format(amount)
}

/**
 * Get the currency symbol for the user's selected currency
 * 
 * @returns Currency symbol (e.g., "$", "R$", "€")
 */
export function getCurrencySymbol(): string {
    const { symbol } = getCurrencyConfig()
    return symbol
}

/**
 * Format a number without currency symbol (just the number with locale formatting)
 * 
 * @param amount - The amount to format
 * @returns Formatted number string (e.g., "1.234.567")
 */
export function formatNumber(amount: number): string {
    const { locale } = getCurrencyConfig()

    return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0
    }).format(amount)
}
