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

// HOT CACHE para entornos Serverless (Vercel)
// Esto permite que el estado persista mientras la lambda esté "tibia" (Warm)
let _dbCache: DBContent | null = null

export function getDB(): DBContent {
    if (_dbCache) return _dbCache

    if (!fs.existsSync(DB_PATH)) {
        if (!_dbCache) {
            console.log("[STORAGE] DB File not found. Initializing with DEFAULT_DB.");
            _dbCache = { ...DEFAULT_DB }
        }
        return _dbCache
    }

    try {
        const content = fs.readFileSync(DB_PATH, 'utf-8')
        _dbCache = JSON.parse(content)
        return _dbCache!
    } catch (e) {
        return DEFAULT_DB
    }
}

export function saveDB(data: DBContent) {
    _dbCache = data // Actualizar cache siempre primero (Efecto instantáneo en memoria)
    try {
        const dir = path.dirname(DB_PATH)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
    } catch (e) {
        // En Vercel el write puede fallar por solo-lectura, pero el cache en memoria 
        // servirá para la sesión activa del usuario.
        console.warn("Vercel FS Persistence limited. Using memory cache.")
    }
}
