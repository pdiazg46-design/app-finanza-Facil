import { useEffect, useState } from 'react'

export type Locale = 'es-CL' | 'pt-BR' | 'en-US'

export interface Translations {
    [key: string]: string | Translations
}

const translations: Record<Locale, Translations> = {
    'es-CL': require('./translations/es.json'),
    'pt-BR': require('./translations/pt.json'),
    'en-US': require('./translations/en.json'),
}

export function getLocaleFromCountry(countryCode: string): Locale {
    const localeMap: Record<string, Locale> = {
        'BR': 'pt-BR',
        'US': 'en-US',
        'CA': 'en-US',
        // All other Americas default to Spanish
    }
    return localeMap[countryCode] || 'es-CL'
}

export function getTranslation(locale: Locale, key: string): string {
    const keys = key.split('.')
    let value: any = translations[locale]

    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k]
        } else {
            // Fallback to Spanish if key not found
            value = translations['es-CL']
            for (const fallbackKey of keys) {
                if (value && typeof value === 'object') {
                    value = value[fallbackKey]
                } else {
                    return key // Return key itself if not found
                }
            }
            break
        }
    }

    return typeof value === 'string' ? value : key
}

export function useLocale() {
    const [locale, setLocale] = useState<Locale>('es-CL')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedCountry = localStorage.getItem('selectedCountry')
            if (savedCountry) {
                setLocale(getLocaleFromCountry(savedCountry))
            }
        }
    }, [])

    const t = (key: string) => getTranslation(locale, key)

    return { locale, t, setLocale }
}
