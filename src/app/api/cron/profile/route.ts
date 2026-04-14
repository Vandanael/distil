import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/auth/cron'
import { generateProfiles } from '@/lib/agents/profile-generator'

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  try {
    const results = await generateProfiles()
    return NextResponse.json({
      usersProcessed: results.length,
      results,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
