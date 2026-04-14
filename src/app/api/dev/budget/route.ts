import { NextResponse } from 'next/server'
import { budgetStatus } from '@/lib/api-budget'

export async function GET() {
  return NextResponse.json(budgetStatus())
}
