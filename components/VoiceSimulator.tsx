'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { parseVoiceCommand, generateConfirmationMessage, ParsedCommand } from "@/lib/voice-nlp"
import { registerExpense, addContribution, getFundMetrics } from '../app/actions/fund-actions'
import { FinanceEngine } from '@/lib/finance-engine'
import { useLocaleContext } from './LocaleContext'
import { formatCurrency } from '@/lib/currency-formatter'

// Extend browser types for Speech Recognition
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

export function VoiceSimulator() {
    const { t } = useLocaleContext()
    const router = useRouter()
    const [isProcessing, setIsProcessing] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [isPreparing, setIsPreparing] = useState(false)
    const [status, setStatus] = useState<string | null>(null)
    const [interimTranscript, setInterimTranscript] = useState("")
    const [pendingCommand, setPendingCommand] = useState<ParsedCommand | null>(null)
    const [lastResult, setLastResult] = useState<{ name: string, amount: number, impact?: number } | null>(null)
    const [confirmationMessage, setConfirmationMessage] = useState("")
    const recognitionRef = useRef<any>(null)
    const interimRef = useRef("")

    // Función para generar un "beep" sintético y vibración cuando el mic está listo
    const playReadySound = () => {
        try {
            // Haptic feedback
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(50);
            }

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            const audioCtx = new AudioContextClass();

            // Safari fix: Resume context inside user gesture
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            console.warn("Audio feedback failed", e);
        }
    }

    const startRecording = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

        if (!SpeechRecognition) {
            alert("Tu navegador no soporta reconocimiento de voz. Usando modo simulación.")
            const command = prompt("Simula tu comando (Ej: 'Netflix 15 lucas'):")
            if (command) handleProcessCommand(command)
            return
        }

        setIsPreparing(true)
        setStatus("Iniciando...")

        const recognition = new SpeechRecognition()
        recognition.lang = 'es-CL'
        // Safari mobile is more stable with false, Android prefers true. 
        // Force false for a single reliable recording session on all devices.
        recognition.continuous = false
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
            setIsPreparing(false)
            setIsRecording(true)
            setStatus(t('voice.recording'))
            setInterimTranscript("")
            playReadySound()
        }

        recognition.onresult = (event: any) => {
            let currentInterim = ""
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    interimRef.current = event.results[i][0].transcript
                } else {
                    currentInterim += event.results[i][0].transcript
                }
            }
            if (currentInterim) {
                interimRef.current = currentInterim
                setInterimTranscript(currentInterim)
            }
        }

        recognition.onerror = (event: any) => {
            console.error("Speech Recognition Error:", event.error)
            setIsPreparing(false)
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                setStatus(t('voice.audioError'))
            }
            setIsRecording(false)
            setTimeout(() => setStatus(null), 2000)
        }

        recognition.onend = () => {
            setIsRecording(false)
            setIsPreparing(false)
            const finalVal = interimRef.current
            if (!isProcessing && finalVal && finalVal.length > 2) {
                handleProcessCommand(finalVal)
            } else if (!finalVal || finalVal.length <= 2) {
                // Keep the "no audio" feedback brief
                if (status === t('voice.preparing') || isRecording) {
                    setStatus(t('voice.noAudio'))
                    setTimeout(() => setStatus(null), 2000)
                }
            }
        }

        recognitionRef.current = recognition
        recognition.start()
    }

    const stopRecording = (e?: React.MouseEvent | React.TouchEvent) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop()
        }
    }

    const handleProcessCommand = async (command: string) => {
        if (!command || isProcessing) return

        setIsProcessing(true)
        setStatus(t('voice.processing'))
        interimRef.current = ""

        try {
            // Parse command with enhanced NLP
            const parsed = parseVoiceCommand(command)

            if (!parsed || parsed.confidence < 0.5) {
                setStatus(t('voice.error'))
                setTimeout(() => {
                    setStatus(null)
                    setInterimTranscript("")
                }, 3000)
                setIsProcessing(false)
                return
            }

            // Add expense or contribution directly
            setStatus(t('voice.saving'))

            let result;
            if (parsed.type === 'CONTRIBUTION') {
                result = await addContribution(parsed.amount, 'user-voice')
            } else {
                result = await registerExpense({
                    description: parsed.name,
                    amount: parsed.amount,
                    installments: parsed.installments,
                    category: parsed.type as string
                })
            }

            if (result.success) {
                // Calculate impact if it's an expense
                let impact = undefined;
                if (parsed.type !== 'CONTRIBUTION') {
                    const { fund } = await getFundMetrics();
                    impact = FinanceEngine.calculateExpenseImpact(parsed.amount, fund.monthlyBurnRate);
                }

                setLastResult({ name: parsed.name, amount: parsed.amount, impact })
                setStatus(parsed.type === 'CONTRIBUTION' ? t('voice.incomeSaved') : t('voice.saved'))

                router.refresh()

                setTimeout(() => {
                    setLastResult(null)
                    setStatus(null)
                    setInterimTranscript("")
                }, 4000)
            } else {
                setStatus("Error al guardar")
                setTimeout(() => setStatus(null), 2000)
            }

            setIsProcessing(false)

        } catch (error) {
            setStatus("Error de procesamiento")
            setTimeout(() => setStatus(null), 2000)
            setIsProcessing(false)
        }
    }

    const confirmCommand = async () => {
        if (!pendingCommand) return

        setIsProcessing(true)
        setStatus("Guardando...")

        try {
            const { syncFullBudget } = await import('../app/actions/fund-actions')

            const finalName = pendingCommand.installments > 1
                ? `${pendingCommand.name} (${pendingCommand.installments} cuotas)`
                : pendingCommand.name

            await syncFullBudget([{
                id: 'temp-' + Date.now(),
                name: finalName,
                amount: pendingCommand.amount,
                type: pendingCommand.type,
                action: 'CREATE' as const
            }], { name: '', contribution: 0 })

            setStatus("✅ ¡Guardado!")
            setLastResult({ name: pendingCommand.name, amount: pendingCommand.amount })
            setPendingCommand(null)
            setConfirmationMessage("")
            setInterimTranscript("")

            router.refresh()

            setTimeout(() => {
                setStatus(null)
                setLastResult(null)
            }, 4000)

        } catch (error) {
            console.error('Error saving:', error)
            setStatus("Error al guardar")
            setTimeout(() => setStatus(null), 2000)
        } finally {
            setIsProcessing(false)
        }
    }

    const rejectCommand = () => {
        setPendingCommand(null)
        setConfirmationMessage("")
        setInterimTranscript("")
        setStatus("Cancelado")
        setTimeout(() => setStatus(null), 2000)
    }

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 flex flex-col items-center justify-center z-50 gap-3 pointer-events-none [.coach-active_&]:hidden">
            <div className="pointer-events-auto flex flex-col items-center gap-3 w-full">

                {/* Feedback Visual e Interino */}
                {(status || isRecording || isPreparing || interimTranscript || lastResult) && !pendingCommand && (
                    <div className="bg-white/95 backdrop-blur px-5 py-3 rounded-2xl shadow-2xl border border-blue-50 animate-in fade-in zoom-in slide-in-from-bottom-4 flex flex-col items-center gap-2 max-w-[90%] text-center">
                        {lastResult ? (
                            <div className="flex flex-col items-center">
                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${status?.includes('Ingreso') ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {status?.includes('✅') ? status.replace('✅ ', '') : 'Movimiento Registrado'}
                                </span>
                                <span className="text-sm font-bold text-slate-800 leading-tight mb-0.5">{lastResult.name}</span>
                                <span className={`text-lg font-black font-[family-name:var(--font-montserrat)] ${status?.includes('Ingreso') ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatCurrency(lastResult.amount)}
                                </span>
                                {lastResult.impact && lastResult.impact > 0 && (
                                    <span className="text-[10px] font-bold text-orange-500 mt-1 animate-pulse">
                                        -{lastResult.impact.toFixed(1)} días de respiro
                                    </span>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    {(isRecording || isPreparing) && (
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${isPreparing ? 'bg-amber-400' : 'bg-red-500'}`} />
                                    )}
                                    <span className="text-[10px] font-bold text-atsit-blue uppercase tracking-widest leading-none">
                                        {status || (isPreparing ? "Preparando" : "Grabando")}
                                    </span>
                                </div>
                                {interimTranscript && (
                                    <span className="text-[11px] text-slate-500 italic leading-tight">
                                        &quot;{interimTranscript}&quot;
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Botón Circular - Hold to Talk (WhatsApp style) */}
                <button
                    onMouseDown={(e) => { e.preventDefault(); startRecording(); }}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                    onTouchEnd={stopRecording}
                    disabled={isProcessing || isPreparing || !!pendingCommand}
                    className={`h-16 w-16 rounded-full shadow-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-110 border-0 relative overflow-hidden group select-none touch-none
                    ${isRecording ? 'bg-red-600 scale-110' : isPreparing ? 'bg-amber-500' : 'bg-[#0056B3] hover:bg-[#003870]'}
                    ${pendingCommand ? 'opacity-50' : ''}
                `}
                >
                    {isProcessing || isPreparing ? (
                        <Loader2 className="h-7 w-7 text-white animate-spin" />
                    ) : (
                        <Mic className="h-8 w-8 text-white" strokeWidth={2.5} />
                    )}

                    {/* Ondas de audio cuando graba */}
                    {isRecording && (
                        <>
                            <div className="absolute inset-0 border-4 border-white/30 rounded-full animate-ping" />
                            <div className="absolute inset-0 border-4 border-white/20 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
                        </>
                    )}
                </button>

                {/* Instruction text */}
                {!isRecording && !pendingCommand && !status && (
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider text-center">
                        {t('voice.holdToSpeak')}
                    </p>
                )}

            </div>
        </div>
    )
}
