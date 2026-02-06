'use client'

import { useState, useEffect } from 'react'
import { Check, Globe } from 'lucide-react'
import { useLocaleContext } from './LocaleContext'

export function CountrySelector() {
    const { t } = useLocaleContext()
    const [isVisible, setIsVisible] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const savedCountry = localStorage.getItem('at-sit-user-country')
        if (!savedCountry) {
            setIsVisible(true)
        }
    }, [])

    const handleSelect = (country: string, currency: string, locale: string, symbol: string) => {
        localStorage.setItem('selectedCountry', country) // Used by LocaleContext
        localStorage.setItem('at-sit-user-country', country)
        localStorage.setItem('at-sit-user-currency', currency)
        localStorage.setItem('at-sit-user-currency-symbol', symbol) // Used by CurrencyText
        localStorage.setItem('at-sit-user-locale', locale)

        window.dispatchEvent(new Event('storage'))
        window.location.reload()
    }

    const COUNTRIES = [
        { code: 'CL', flag: '🇨🇱', name: 'Chile', currency: 'CLP', symbol: '$', locale: 'es-CL' },
        { code: 'BR', flag: '🇧🇷', name: 'Brasil', currency: 'BRL', symbol: 'R$', locale: 'pt-BR' },
        { code: 'AR', flag: '🇦🇷', name: 'Argentina', currency: 'ARS', symbol: '$', locale: 'es-AR' },
        { code: 'MX', flag: '🇲🇽', name: 'México', currency: 'MXN', symbol: '$', locale: 'es-MX' },
        { code: 'CO', flag: '🇨🇴', name: 'Colombia', currency: 'COP', symbol: '$', locale: 'es-CO' },
        { code: 'PE', flag: '🇵🇪', name: 'Perú', currency: 'PEN', symbol: 'S/', locale: 'es-PE' },
        { code: 'US', flag: '🇺🇸', name: 'USA / Intl', currency: 'USD', symbol: '$', locale: 'en-US' },
        { code: 'UY', flag: '🇺🇾', name: 'Uruguay', currency: 'UYU', symbol: '$', locale: 'es-UY' },
        { code: 'CA', flag: '🇨🇦', name: 'Canadá', currency: 'CAD', symbol: '$', locale: 'en-CA' },
        { code: 'PY', flag: '🇵🇾', name: 'Paraguay', currency: 'PYG', symbol: '₲', locale: 'es-PY' },
        { code: 'BO', flag: '🇧🇴', name: 'Bolivia', currency: 'BOB', symbol: 'Bs', locale: 'es-BO' },
        { code: 'EC', flag: '🇪🇨', name: 'Ecuador', currency: 'USD', symbol: '$', locale: 'es-EC' },
        { code: 'VE', flag: '🇻🇪', name: 'Venezuela', currency: 'VES', symbol: 'Bs', locale: 'es-VE' },
        { code: 'GT', flag: '🇬🇹', name: 'Guatemala', currency: 'GTQ', symbol: 'Q', locale: 'es-GT' },
        { code: 'CR', flag: '🇨🇷', name: 'Costa Rica', currency: 'CRC', symbol: '₡', locale: 'es-CR' },
        { code: 'DO', flag: '🇩🇴', name: 'Rep. Dominicana', currency: 'DOP', symbol: 'RD$', locale: 'es-DO' },
        { code: 'PA', flag: '🇵🇦', name: 'Panamá', currency: 'USD', symbol: '$', locale: 'es-PA' }, // Usa USD oficial
    ]

    if (!mounted || !isVisible) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="bg-slate-50 px-6 py-6 text-center border-b border-slate-100 shrink-0">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 text-blue-600">
                        <Globe className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 mb-1">{t('country.selector.title')}</h2>
                    <p className="text-sm text-slate-500">{t('country.selector.subtitle')}</p>
                </div>

                {/* Options List */}
                <div className="p-4 overflow-y-auto space-y-2 flex-1">
                    {COUNTRIES.map((country) => (
                        <button
                            key={country.code}
                            onClick={() => handleSelect(country.code, country.currency, country.locale, country.symbol)}
                            className="w-full group relative flex items-center gap-4 p-3 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-95"
                        >
                            <span className="text-3xl shadow-sm rounded-full overflow-hidden">{country.flag}</span>
                            <div className="text-left">
                                <p className="font-bold text-slate-900 text-base group-hover:text-blue-700">{country.name}</p>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{country.currency} ({country.symbol})</p>
                            </div>
                            <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600">
                                <Check className="w-5 h-5" />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 text-center border-t border-slate-100 shrink-0 bg-slate-50/50">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        Todas las monedas de América
                    </p>
                </div>
            </div>
        </div>
    )
}
