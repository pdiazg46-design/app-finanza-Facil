'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Info, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from "next-auth/react"

interface InfoTooltipProps {
    title: string
    content: string
    description?: string
    variant?: 'dark' | 'light'
}

export function InfoTooltip({ title, content, description, variant = 'dark' }: InfoTooltipProps) {
    const [isOpen, setIsOpen] = useState(false)
    const modalRef = useRef<HTMLDivElement>(null)
    const { data: session } = useSession()

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

    return (
        <div className="relative inline-flex items-center">
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(!isOpen)
                }}
                className={`p-1 hover:bg-slate-100/10 rounded-full transition-colors active:scale-95 ${variant === 'light' ? 'text-white/80' : 'text-slate-900'}`}
                title="Ver información"
            >
                <Info className="w-4 h-4" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            ref={modalRef}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-slate-100"
                        >
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
                                <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest mb-2">
                                    {title}
                                </h3>
                                <p className="text-[13px] leading-relaxed text-slate-800 font-bold">
                                    {content}
                                </p>
                            </div>

                            {description && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-[11px] text-slate-900 font-black uppercase mb-1 tracking-widest">
                                        Impacto en tu libertad:
                                    </p>
                                    <p className="text-[12px] text-slate-700 italic font-black">
                                        {description}
                                    </p>
                                </div>
                            )}

                            <div className="mt-6">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform"
                                >
                                    Entendido
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
