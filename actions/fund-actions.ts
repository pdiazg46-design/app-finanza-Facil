
// Mock with permissive signatures to bypass Type check
export async function getFundMetrics() {
    return {
        fund: {
            monthlyBurnRate: 1000000,
            balance: 5000000,
            totalSavings: 5000000,
            partnerName: 'Pareja',
            partnerContribution: 0
        }
    }
}
export async function addMovement(...args: any[]) { return { success: true } }
export async function deleteMovement(...args: any[]) { return { success: true } }
export async function updateBudget(...args: any[]) { return { success: true } }
export async function updateAsset(...args: any[]) { return { success: true } }
export async function syncFullBudget(...args: any[]) { return { success: true } }
export async function registerExpense(...args: any[]) { return { success: true } }
export async function addContribution(...args: any[]) { return { success: true } }
