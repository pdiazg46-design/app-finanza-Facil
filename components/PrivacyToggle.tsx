'use client'

import { Eye, EyeOff } from 'lucide-react'
import { usePrivacy } from './PrivacyContext'
import { useLocaleContext } from './LocaleContext'

export function PrivacyToggle() {
    const { isPrivate, togglePrivacy } = usePrivacy()
    const { t } = useLocaleContext()

    return (
        <button
            onClick={togglePrivacy}
            className="p-2 bg-slate-100/80 backdrop-blur-sm rounded-xl hover:bg-slate-200 transition-all active:scale-95 shadow-sm border border-slate-200/50 flex items-center justify-center"
            title={isPrivate ? t('privacy.show') : t('privacy.hide')}
        >
            {isPrivate ? (
                <EyeOff className="w-4 h-4 text-slate-500" />
            ) : (
                <Eye className="w-4 h-4 text-atsit-blue" />
            )}
        </button>
    )
}
