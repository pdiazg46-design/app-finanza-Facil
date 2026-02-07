'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, getLocaleFromCountry, getTranslation } from '@/lib/i18n'

interface LocaleContextType {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function LocaleProvider({ children }: { children: ReactNode }) {
    // Read saved country synchronously during initialization to avoid flash
    const getInitialLocale = (): Locale => {
        if (typeof window !== 'undefined') {
            let savedCountry = localStorage.getItem('selectedCountry')

            // MIGRATION: If selectedCountry doesn't exist but at-sit-user-country does, migrate it
            if (!savedCountry) {
                const legacyCountry = localStorage.getItem('at-sit-user-country')
                if (legacyCountry) {
                    console.log('[LocaleContext] Migrating legacy country:', legacyCountry)
                    localStorage.setItem('selectedCountry', legacyCountry)
                    savedCountry = legacyCountry
                }
            }

            console.log('[LocaleContext] Initial savedCountry:', savedCountry)
            if (savedCountry) {
                const locale = getLocaleFromCountry(savedCountry)
                console.log('[LocaleContext] Initial locale from country:', locale)
                return locale
            }
        }
        console.log('[LocaleContext] Using default locale: es-CL')
        return 'es-CL' // Default fallback
    }

    const [locale, setLocaleState] = useState<Locale>(getInitialLocale())

    useEffect(() => {
        // Read saved country from localStorage with migration
        let savedCountry = localStorage.getItem('selectedCountry')

        // MIGRATION: Sync with legacy key
        if (!savedCountry) {
            const legacyCountry = localStorage.getItem('at-sit-user-country')
            if (legacyCountry) {
                console.log('[LocaleContext] useEffect migrating legacy country:', legacyCountry)
                localStorage.setItem('selectedCountry', legacyCountry)
                savedCountry = legacyCountry
            }
        }

        console.log('[LocaleContext] useEffect savedCountry:', savedCountry)
        if (savedCountry) {
            const detectedLocale = getLocaleFromCountry(savedCountry)
            console.log('[LocaleContext] useEffect detected locale:', detectedLocale)
            setLocaleState(detectedLocale)
        }

        // Listen for country changes from storage (other tabs)
        const handleStorageChange = (e: StorageEvent) => {
            console.log('[LocaleContext] Storage event:', e.key, e.newValue)
            if (e.key === 'selectedCountry' && e.newValue) {
                const newLocale = getLocaleFromCountry(e.newValue)
                console.log('[LocaleContext] New locale from storage:', newLocale)
                setLocaleState(newLocale)
            }
        }

        // Listen for custom locale change event (same tab)
        const handleLocaleChange = () => {
            const savedCountry = localStorage.getItem('selectedCountry')
            console.log('[LocaleContext] localeChange event, savedCountry:', savedCountry)
            if (savedCountry) {
                const newLocale = getLocaleFromCountry(savedCountry)
                console.log('[LocaleContext] New locale from localeChange:', newLocale)
                setLocaleState(newLocale)
            }
        }

        window.addEventListener('storage', handleStorageChange)
        window.addEventListener('localeChange', handleLocaleChange)

        return () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('localeChange', handleLocaleChange)
        }
    }, [])

    const setLocale = (newLocale: Locale) => {
        console.log('[LocaleContext] setLocale called with:', newLocale)
        setLocaleState(newLocale)
    }

    const t = (key: string) => getTranslation(locale, key)

    console.log('[LocaleContext] Current locale:', locale)

    return (
        <LocaleContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LocaleContext.Provider>
    )
}

export function useLocaleContext() {
    const context = useContext(LocaleContext)
    if (!context) {
        throw new Error('useLocaleContext must be used within LocaleProvider')
    }
    return context
}
