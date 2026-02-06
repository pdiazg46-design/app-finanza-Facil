'use client'

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { InfoTooltip } from "./InfoTooltip"
import { TrendingDown, Wallet } from "lucide-react"
import { CurrencyText } from "@/components/CurrencyText"
import { MiniChart } from "@/components/MiniChart"

interface LiquidityCardProps {
    type: 'common' | 'disposable'
    title: string
    subtitle: string
    amount: number
    projectedExpenses?: number
    infoContent: string
    infoDescription?: string
}

export function LiquidityCard({
    type,
    title,
    subtitle,
    amount,
    projectedExpenses,
    infoContent,
    infoDescription
}: LiquidityCardProps) {
    if (type === 'common') {
        return (
            <Card className="shadow-lg border-0 bg-white rounded-3xl overflow-hidden hover:shadow-xl transition-shadow border border-slate-50">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-atsit-blue animate-pulse" />
                            <p className="text-[12px] font-black text-slate-900 uppercase tracking-tighter">{title}</p>
                        </div>
                        <InfoTooltip title={title} content={infoContent} description={infoDescription} />
                    </div>
                    <p className="text-[11px] text-slate-600 mb-2 font-black uppercase tracking-tight">{subtitle}</p>
                    <p className="text-xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-montserrat)]">
                        <CurrencyText value={amount} />
                    </p>
                    <div className="mt-3 mb-2 opacity-60">
                        <MiniChart />
                    </div>
                    <div className="flex flex-col gap-1 pt-2 border-t border-slate-50">
                        <div className="flex items-center text-red-600 text-[11px] font-black uppercase tracking-tighter">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            <span>Cuentas por pagar</span>
                        </div>
                        <div className="text-[14px] font-black text-slate-900 pl-4">
                            <CurrencyText value={projectedExpenses || 0} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="shadow-lg border-0 bg-slate-50 rounded-3xl group cursor-pointer hover:bg-white hover:shadow-xl transition-all border border-slate-100/50 relative overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
                <InfoTooltip title={title} content={infoContent} description={infoDescription} />
            </div>
            <CardContent className="p-4 flex flex-col items-center text-center justify-center min-h-[160px]">
                <div className="p-2 bg-white rounded-2xl mb-3 shadow-sm group-hover:bg-atsit-blue group-hover:text-white transition-colors">
                    <Wallet className="w-5 h-5 text-slate-700 group-hover:text-white" />
                </div>
                <p className="text-[12px] font-black text-slate-900 uppercase tracking-tighter mb-1">{title}</p>
                <p className="text-[11px] text-slate-600 mb-3 font-black uppercase tracking-tight">{subtitle}</p>
                <div className="text-xl font-black text-slate-800 tracking-tight font-[family-name:var(--font-montserrat)]">
                    <CurrencyText value={amount} />
                </div>
            </CardContent>
        </Card>
    )
}
