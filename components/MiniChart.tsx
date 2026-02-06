'use client'

interface MiniChartProps {
    data?: number[]
    color?: string
}

export function MiniChart({
    data = [350000, 340000, 345000, 335000, 350000],
    color = "#0056B3"
}: MiniChartProps) {
    const width = 80
    const height = 30
    const padding = 2

    // Normalize data to fit in chart
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * (width - padding * 2) + padding
        const y = height - padding - ((value - min) / range) * (height - padding * 2)
        return `${x},${y}`
    }).join(' ')

    return (
        <svg width={width} height={height} className="opacity-60">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}
