import type { RequestFn } from '../stock-movements/types'
import type { Movement } from '../movement-history/api'

export type DailyActivity = { date: string; stockInCount: number; stockOutCount: number }
export type Dashboard = { activeProductCount: number; lowStockActiveProductCount: number; outOfStockActiveProductCount: number; latestMovements: Movement[]; dailyActivity: DailyActivity[] }
export function getDashboard(request: RequestFn, range: { fromUtc: string; toUtc: string }) { const params = new URLSearchParams({ fromUtc: range.fromUtc, toUtc: range.toUtc }); return request<Dashboard>(`/api/dashboard?${params}`) }
