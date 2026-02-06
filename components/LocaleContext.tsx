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
    const [locale, setLocaleState] = useState<Locale>('es-CL')

    useEffect(() => {
        // Read saved country from localStorage
        const savedCountry = localStorage.getItem('selectedCountry')
        if (savedCountry) {
            const detectedLocale = getLocaleFromCountry(savedCountry)
            setLocaleState(detectedLocale)
        }

        // Listen for country changes
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'selectedCountry' && e.newValue) {
                const newLocale = getLocaleFromCountry(e.newValue)
                setLocaleState(newLocale)
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale)
    }

    const t = (key: string) => getTranslation(locale, key)

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
