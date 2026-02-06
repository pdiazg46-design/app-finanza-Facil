// Enhanced Natural Language Processing for Voice Commands
// No external APIs - 100% local processing

export interface ParsedCommand {
    name: string
    amount: number
    type: 'SUBSCRIPTION' | 'FIXED_PAGO' | 'VARIABLE_SERVICE' | 'CONTRIBUTION'
    installments: number
    confidence: number
}

// Localized slang and numeric synonyms
const LOCALIZED_SYNONYMS: Record<string, Record<string, number>> = {
    'CLP': {
        'lucas': 1000, 'luca': 1000, 'luka': 1000, 'lukas': 1000,
        'mil': 1000, 'palo': 1000000, 'palos': 1000000, 'millón': 1000000, 'millon': 1000000
    },
    'PEN': {
        'sol': 1, 'soles': 1, 'quinto': 0.5, 'luca': 1, 'mil': 1000,
        'palo': 1000000, 'palos': 1000000, 'millón': 1000000, 'millon': 1000000
    },
    'USD': {
        'buck': 1, 'bucks': 1, 'grand': 1000, 'mil': 1000,
        'million': 1000000, 'millon': 1000000
    }
}

// Default synonyms if currency not found
const DEFAULT_AMOUNT_SYNONYMS: Record<string, number> = LOCALIZED_SYNONYMS['CLP']

const NUMBER_WORDS: Record<string, number> = {
    'cero': 0, 'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4,
    'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9,
    'diez': 10, 'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14,
    'quince': 15, 'dieciséis': 16, 'dieciseis': 16, 'diecisiete': 17,
    'dieciocho': 18, 'diecinueve': 19, 'veinte': 20, 'treinta': 30,
    'cuarenta': 40, 'cincuenta': 50, 'sesenta': 60, 'setenta': 70,
    'ochenta': 80, 'noventa': 90, 'cien': 100, 'ciento': 100,
    'doscientos': 200, 'trescientos': 300, 'cuatrocientos': 400,
    'quinientos': 500, 'seiscientos': 600, 'setecientos': 700,
    'ochocientos': 800, 'novecientos': 900
}

// Subscription keywords
const SUBSCRIPTION_KEYWORDS = [
    'netflix', 'spotify', 'amazon', 'prime', 'disney', 'hbo', 'apple',
    'youtube', 'premium', 'suscripción', 'suscripcion', 'mensual',
    'plan', 'servicio'
]

// Fixed payment keywords
const FIXED_KEYWORDS = [
    'arriendo', 'alquiler', 'crédito', 'credito', 'préstamo', 'prestamo',
    'cuota', 'cuotas', 'dividendo', 'hipoteca', 'auto', 'carro'
]

// Variable service keywords
const VARIABLE_KEYWORDS = [
    'luz', 'agua', 'gas', 'internet', 'teléfono', 'telefono', 'celular',
    'electricidad', 'promedio',
    // Supermarket and food
    'super', 'supermercado', 'mercado', 'compra', 'compras', 'jumbo', 'lider', 'unimarc', 'santa isabel', 'tottus',
    'almacén', 'almacen', 'feria', 'verduras', 'frutas', 'comida', 'alimentos'
]

// Contribution/Income keywords
const CONTRIBUTION_KEYWORDS = [
    'aporte', 'ingreso', 'abono', 'sueldo', 'abone', 'puse', 'agregue', 'agrego', 'sume', 'deposite', 'cargue', 'sumar', 'sumé'
]

// Installment detection patterns
const INSTALLMENT_PATTERNS = [
    /(\d+)\s*cuotas?/i,
    /en\s*(\d+)\s*(pagos?|veces)/i,
    /(\d+)\s*dividendos?/i,
    /(\d+)x/i
]

/**
 * Parse text numbers to numeric values
 * Example: "quince mil" -> 15000
 */
function parseTextNumber(text: string, currency: string = 'CLP'): number | null {
    const words = text.toLowerCase().split(/\s+/)
    let total = 0
    let current = 0
    const synonyms = LOCALIZED_SYNONYMS[currency] || DEFAULT_AMOUNT_SYNONYMS

    for (const word of words) {
        if (NUMBER_WORDS[word] !== undefined) {
            const value = NUMBER_WORDS[word]
            if (value >= 100) {
                current = current === 0 ? value : current * value
            } else {
                current += value
            }
        } else if (synonyms[word]) {
            current = current === 0 ? 1 : current
            total += current * synonyms[word]
            current = 0
        }
    }

    total += current
    return total > 0 ? total : null
}

/**
 * Extract amount from command
 * Handles: "15000", "15 mil", "15 lucas", "quince mil", "100 soles", "50 bucks"
 */
function extractAmount(command: string, currency: string = 'CLP'): number {
    const normalized = command.toLowerCase().trim()
    const synonyms = LOCALIZED_SYNONYMS[currency] || DEFAULT_AMOUNT_SYNONYMS

    // Special pattern: "X cuotas de Y [unit]"
    const installmentAmountMatch = normalized.match(/(\d+)\s*cuotas?\s+de\s+(\d+)\s*(mil|lucas?|lukas?|soles?|bucks?)/i)
    if (installmentAmountMatch) {
        let amount = parseFloat(installmentAmountMatch[2])
        const unit = installmentAmountMatch[3]?.toLowerCase()

        if (unit && synonyms[unit]) {
            amount *= synonyms[unit]
        }
        return Math.round(amount)
    }

    // Priority 1: Number + explicit unit (mil, lucas, soles, bucks, etc.)
    const withUnitMatch = normalized.match(/(\d+(?:[.,\s]*\d+)*)\s*(mil|lucas?|lukas?|palos?|soles?|bucks?)/i)
    if (withUnitMatch) {
        const rawNumber = withUnitMatch[1].replace(/\./g, '').replace(',', '.')
        let amount = parseFloat(rawNumber)
        const unit = withUnitMatch[2].toLowerCase()

        if (synonyms[unit]) {
            amount *= synonyms[unit]
            return Math.round(amount)
        }
    }

    // Priority 2: Text number parsing
    const textAmount = parseTextNumber(normalized, currency)
    if (textAmount && textAmount >= 1000) {
        return textAmount
    }

    // Priority 3: Direct number + currency name (pesos, soles, dollars)
    const currencyNameMatch = normalized.match(/(\d+(?:[.,\s]*\d+)*)\s*(pesos?|soles?|d[oó]lares?|dollars?)/i)
    if (currencyNameMatch) {
        const cleanNumber = currencyNameMatch[1].replace(/[.,\s]/g, '')
        const amount = Math.round(parseFloat(cleanNumber))
        return amount
    }

    // Priority 4: Just a number
    const numberOnly = normalized.match(/(\d+(?:[.,\s]*\d+)*)/)
    if (numberOnly) {
        const cleanNumber = numberOnly[1].replace(/[.,\s]/g, '')
        if (cleanNumber.length > 0) {
            const amount = Math.round(parseFloat(cleanNumber))
            return amount
        }
    }

    return textAmount || 0
}

/**
 * Extract installments from command
 */
function extractInstallments(command: string): number {
    for (const pattern of INSTALLMENT_PATTERNS) {
        const match = command.match(pattern)
        if (match) {
            return parseInt(match[1])
        }
    }
    return 1
}

/**
 * Detect expense type based on keywords
 */
function detectType(command: string): 'SUBSCRIPTION' | 'FIXED_PAGO' | 'VARIABLE_SERVICE' | 'CONTRIBUTION' {
    const normalized = command.toLowerCase()

    // Check for installments first (strong indicator of FIXED_PAGO)
    if (extractInstallments(command) > 1) {
        return 'FIXED_PAGO'
    }

    // Check contribution keywords first (it could be an "aporte" to a service, treat as aporte)
    if (CONTRIBUTION_KEYWORDS.some(kw => normalized.includes(kw))) {
        return 'CONTRIBUTION'
    }

    // Check subscription keywords
    if (SUBSCRIPTION_KEYWORDS.some(kw => normalized.includes(kw))) {
        return 'SUBSCRIPTION'
    }

    // Check fixed payment keywords
    if (FIXED_KEYWORDS.some(kw => normalized.includes(kw))) {
        return 'FIXED_PAGO'
    }

    // Check variable service keywords
    if (VARIABLE_KEYWORDS.some(kw => normalized.includes(kw))) {
        return 'VARIABLE_SERVICE'
    }

    // Default to variable service for unrecognized expenses
    // (supermarket, food, etc. are more common than fixed payments)
    return 'VARIABLE_SERVICE'
}

/**
 * Extract expense name from command
 */
function extractName(command: string): string {
    let name = command.toLowerCase().trim()

    // Remove amount patterns (Formatted numbers with dots, spaces or units)
    name = name.replace(/\d+(?:[.,\s]*\d+)*\s*(mil|lucas?|lukas?|palos?|pesos?|millón|millon|clp)/gi, '')
    name = name.replace(/\b(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|cuarenta|cincuenta|cien|ciento|doscientos|quinientos)\s*(mil|lucas?|lukas?|pesos?|millones?)\b/gi, '')
    name = name.replace(/\d+(?:[.,\s]*\d+)*/g, '')

    // Remove contribution keywords
    for (const kw of CONTRIBUTION_KEYWORDS) {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi')
        name = name.replace(regex, '')
    }

    // Remove common filler words
    const fillers = ['de', 'en', 'el', 'la', 'los', 'las', 'un', 'una', 'por', 'para', 'al', 'fondo', 'común', 'comun', 'mi', 'nuestro', 'pago', 'pagos', 'cuenta', 'cuentas']
    const words = name.split(/\s+/).filter(w => w && !fillers.includes(w))

    name = words.join(' ').trim()

    // Capitalize first letter
    if (name) {
        name = name.charAt(0).toUpperCase() + name.slice(1)
    }

    return name
}

/**
 * Main parsing function
 */
export function parseVoiceCommand(command: string, currency: string = 'CLP'): ParsedCommand | null {
    const normalized = command.toLowerCase().trim()
    console.log(`🎤 Voice command [${currency}]:`, normalized)

    // Extract amount
    const amount = extractAmount(normalized, currency)
    if (!amount || amount === 0) {
        console.log('❌ No valid amount found')
        return null
    }

    // Extract name
    let name = extractName(normalized)
    const type = detectType(normalized)

    // Fallback names for specific types if empty
    if (!name) {
        if (type === 'CONTRIBUTION') name = 'Aporte'
        else name = 'Gasto'
    }

    // Everything is a variable service (simple!)
    const result: ParsedCommand = {
        name,
        amount,
        type,
        installments: 1,
        confidence: 0.9
    }

    console.log('✅ Parsed:', result)
    return result
}

/**
 * Generate confirmation message
 */
export function generateConfirmationMessage(parsed: ParsedCommand, locale: string = 'es-CL', currency: string = 'CLP'): string {
    const formattedAmount = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0
    }).format(parsed.amount)

    if (parsed.installments > 1) {
        return `¿Agregar ${parsed.name} en ${parsed.installments} cuotas de ${formattedAmount}?`
    }

    const typeLabel = parsed.type === 'SUBSCRIPTION' ? 'suscripción' :
        parsed.type === 'VARIABLE_SERVICE' ? 'servicio variable' :
            parsed.type === 'CONTRIBUTION' ? 'aporte' : 'gasto fijo'

    return `¿Agregar ${parsed.name} (${typeLabel}) por ${formattedAmount}?`
}
