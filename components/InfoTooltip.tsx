'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Info, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from "next-auth/react"
import { useLocaleContext } from './LocaleContext'
import { DevLabel } from './DevLabel'

interface InfoTooltipProps {
    title: string
    content: string
    description?: string
    variant?: 'dark' | 'light'
    debugName?: string
}

export function InfoTooltip({ title, content, description, variant = 'dark', debugName }: InfoTooltipProps) {
    const [isOpen, setIsOpen] = useState(false)
    const modalRef = useRef<HTMLDivElement>(null)
    const { data: session } = useSession()
    const { t } = useLocaleContext()

    // Bloquear scroll del body cuando el modal está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    const isPremium = session?.user?.plan === 'PREMIUM'
    if (!isPremium) return null

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop opaco */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99998]"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 pointer-events-none">
                        <motion.div
                            ref={modalRef}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-slate-100 pointer-events-auto"
                        >
                            <DevLabel name={debugName || "InfoTooltip Modal"} />
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="mb-4">
                                <div className="w-12 h-12 bg-atsit-blue/10 rounded-2xl flex items-center justify-center mb-4">
                                    <Info className="w-6 h-6 text-atsit-blue" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest mb-3">
                                    {title}
                                </h3>
                                <p className="text-lg leading-relaxed text-slate-700 font-medium">
                                    {content}
                                </p>
                            </div>

                            {description && (
                                <div className="mt-6 pt-6 border-t border-slate-100">
                                    <p className="text-sm text-slate-900 font-black uppercase mb-1 tracking-widest">
                                        {t('tooltips.impactOnFreedom')}
                                    </p>
                                    <p className="text-sm text-slate-700 italic font-bold">
                                        {description}
                                    </p>
                                </div>
                            )}

                            <div className="mt-8">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl text-base font-bold uppercase tracking-widest active:scale-95 transition-transform"
                                >
                                    {t('common.understood')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )

    return (
        <div className="relative inline-flex items-center">
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(!isOpen)
                }}
                className={`p-1 hover:bg-slate-100/10 rounded-full transition-colors active:scale-95 ${variant === 'light' ? 'text-white/80' : 'text-slate-900'}`}
                title={t('tooltips.viewInfo')}
            >
                <Info className="w-4 h-4" />
            </button>

            {/* Render modal in a portal to avoid stacking context issues */}
            {typeof window !== 'undefined' && createPortal(modalContent, document.body)}
        </div>
    )
}
