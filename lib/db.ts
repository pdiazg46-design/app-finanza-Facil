import fs from 'fs'
import path from 'path'

// Client-safe Mock restored to Server Logic
export type CategoryType = 'FIXED_PAGO' | 'VARIABLE_SERVICE' | 'SUBSCRIPTION'

export interface BudgetCategory {
    id: string
    name: string
    amount: number
    type: CategoryType
    isAutomated?: boolean
    installments?: number
    currentInstallment?: number
    installmentStartDate?: string | Date
}

export interface Movement {
    id: string
    type: 'EXPENSE' | 'CONTRIBUTION'
    description: string
    amount: number
    date: string
    installments: number
    category: string
}

export interface DBContent {
    fund: {
        balance: number
        monthlyBurnRate: number
        totalSavings: number
        partnerName: string
        partnerContribution: number
    }
    budget: BudgetCategory[]
    movements: Movement[]
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

export const DEFAULT_DB: DBContent = {
    fund: {
        balance: 0,
        monthlyBurnRate: 0,
        totalSavings: 0,
        partnerName: 'Pareja',
        partnerContribution: 0
    },
    budget: [],
    movements: []
}

let _dbCache: DBContent | null = null

export function getDB(): DBContent {
    // Si tenemos caché (caliente) en memoria, usarla para velocidad
    if (_dbCache) return _dbCache

    if (!fs.existsSync(DB_PATH)) {
        // Asegurar que el directorio data existe
        const dir = path.dirname(DB_PATH)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        _dbCache = DEFAULT_DB
        return DEFAULT_DB
    }

    try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8')
        _dbCache = JSON.parse(raw)
        return _dbCache as DBContent
    } catch (error) {
        console.error("Error reading DB:", error)
        return DEFAULT_DB
    }
}

export function saveDB(data: DBContent) {
    _dbCache = data // Actualizar caché caliente inmediatamente
    try {
        const dir = path.dirname(DB_PATH)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
        console.error("Error saving DB:", error)
    }
}
