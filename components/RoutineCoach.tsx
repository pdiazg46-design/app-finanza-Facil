'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Target, Flame, Database, Mic, Sun, Trophy, Rocket, Sparkles } from 'lucide-react'

interface Step {
    title: string
    description: string
    icon: any
    color: string
    accent: string
    content: React.ReactNode
}

const steps: Step[] = [
    {
        title: "La Meta Maestra",
        description: "En Finanza Fácil, no acumulamos dinero, acumulamos TIEMPO. Nuestra meta compartida es alcanzar los 1.000 días de libertad.",
        icon: Target,
        color: "from-blue-500 to-indigo-600",
        accent: "bg-blue-100 text-blue-600",
        content: (
            <div className="relative h-40 w-full flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-6xl font-black text-slate-800 tracking-tighter"
                >
                    1.000
                </motion.div>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <div className="w-48 h-48 rounded-full border-2 border-dashed border-blue-200" />
                </motion.div>
                <Sparkles className="absolute top-0 right-10 w-6 h-6 text-amber-400 animate-pulse" />
            </div>
        )
    },
    {
        title: "El Burn Rate",
        description: "Vivir tiene un costo. Tu 'Burn Rate' es cuánto dinero necesitas cada día para que tu mundo siga girando sin deudas.",
        icon: Flame,
        color: "from-orange-500 to-red-600",
        accent: "bg-orange-100 text-orange-600",
        content: (
            <div className="h-40 w-full flex items-center justify-center gap-4">
                <div className="relative">
                    <Flame className="w-20 h-20 text-orange-500 animate-bounce" />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-100 rounded-full blur-sm" />
                </div>
                <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('routine.dailyBurn')}</p>
                    <p className="text-2xl font-black text-slate-800 tracking-tight">$35.000</p>
                </div>
            </div>
        )
    },
    {
        title: "Estructura Real",
        description: "Para ganar, primero hay que medir. Configura tus Pasivos Fijos (arriendo, créditos) y Activos para calibrar tu base financiera.",
        icon: Database,
        color: "from-slate-700 to-slate-900",
        accent: "bg-slate-100 text-slate-800",
        content: (
            <div className="h-40 w-full flex items-center justify-center">
                <div className="grid grid-cols-2 gap-2 w-full max-w-[240px]">
                    {[1, 2, 3, 4].map(i => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center px-3"
                        >
                            <div className="w-full h-2 bg-slate-200 rounded-full" />
                        </motion.div>
                    ))}
                </div>
            </div>
        )
    },
    {
        title: "Voz Mágica",
        description: "No pierdas tiempo anotando. Usa el micrófono y di: 'compré sushi por 25 lucas'. El sistema entenderá el monto y el impacto automáticamente.",
        icon: Mic,
        color: "from-emerald-500 to-teal-600",
        accent: "bg-emerald-100 text-emerald-600",
        content: (
            <div className="h-40 w-full flex items-center justify-center">
                <div className="relative">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center"
                    >
                        <Mic className="w-10 h-10 text-emerald-600" />
                    </motion.div>
                    {[1, 2, 3].map(i => (
                        <motion.div
                            key={i}
                            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                            className="absolute inset-0 border-2 border-emerald-200 rounded-full"
                        />
                    ))}
                </div>
            </div>
        )
    },
    {
        title: "Días de Libertad",
        description: "El resultado final: cuántos días puedes vivir hoy si dejaras de trabajar. ¡Cada peso ahorrado compra tiempo de vida!",
        icon: Sun,
        color: "from-amber-400 to-orange-500",
        accent: "bg-amber-100 text-amber-700",
        content: (
            <div className="h-40 w-full flex flex-col items-center justify-center">
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-slate-800">124</span>
                    <span className="text-xl font-bold text-slate-400 uppercase tracking-tight">{t('routine.days')}</span>
                </div>
                <div className="w-48 h-2 bg-slate-100 rounded-full mt-4 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "45%" }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                    />
                </div>
            </div>
        )
    }
]

interface RoutineCoachProps {
    isOpen: boolean
    onClose: () => void
}

export function RoutineCoach({ isOpen, onClose }: RoutineCoachProps) {
    const [currentStep, setCurrentStep] = useState<number | null>(null)
    const [isExiting, setIsExiting] = useState(false)

    useEffect(() => {
        const savedStep = localStorage.getItem('at-sit-coach-step')
        if (savedStep) {
            setCurrentStep(parseInt(savedStep))
        } else {
            setCurrentStep(0)
        }
    }, [])

    useEffect(() => {
        if (currentStep !== null) {
            localStorage.setItem('at-sit-coach-step', currentStep.toString())
        }
    }, [currentStep])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
            document.body.classList.add('coach-active')
        } else {
            document.body.style.overflow = 'unset'
            document.body.classList.remove('coach-active')
        }
        return () => {
            document.body.style.overflow = 'unset'
            document.body.classList.remove('coach-active')
        }
    }, [isOpen])

    const handleNext = () => {
        if (currentStep !== null && currentStep < steps.length - 1) {
            setCurrentStep(prev => (prev ?? 0) + 1)
        } else {
            handleComplete()
        }
    }

    const handleBack = () => {
        if (currentStep !== null && currentStep > 0) {
            setCurrentStep(prev => (prev ?? 1) - 1)
        }
    }

    const handleComplete = () => {
        setIsExiting(true)
        setTimeout(() => {
            onClose()
            setIsExiting(false)
            setCurrentStep(0)
            localStorage.removeItem('at-sit-coach-step')
        }, 500)
    }

    if (!isOpen || currentStep === null) return null

    const step = steps[currentStep]
    const Icon = step.icon

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
            <AnimatePresence mode="wait">
                {!isExiting && (
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col"
                    >
                        {/* Progressive Top Bar */}
                        <div className="flex h-1.5 w-full bg-slate-100">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 transition-all duration-500 ${i <= currentStep ? `bg-gradient-to-r ${step.color}` : 'bg-transparent'}`}
                                />
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className={`w-16 h-16 ${step.accent} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                                <Icon className="w-8 h-8" />
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                                {step.title}
                            </h2>

                            <p className="text-sm text-slate-500 leading-relaxed min-h-[60px]">
                                {step.description}
                            </p>

                            {/* Dynamic Visual Content */}
                            <div className="w-full mt-4 bg-slate-50/50 rounded-3xl overflow-hidden border border-slate-50">
                                {step.content}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-8 pb-8 pt-2 flex flex-col gap-3">
                            <button
                                onClick={handleNext}
                                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 bg-gradient-to-r ${step.color}`}
                            >
                                {currentStep === steps.length - 1 ? '¡Listo para ganar!' : 'Siguiente Pasito'}
                            </button>

                            <div className="flex justify-between items-center px-2">
                                <button
                                    onClick={handleBack}
                                    disabled={currentStep === 0}
                                    className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-opacity ${currentStep === 0 ? 'opacity-0' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <ChevronLeft className="w-3 h-3" /> Atrás
                                </button>

                                <button
                                    onClick={handleComplete}
                                    className="text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-red-400"
                                >
                                    Saltar Tutorial
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Decorative Elements */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        </div>
    )
}
