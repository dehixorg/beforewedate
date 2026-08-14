import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/connect';
import { Match } from '@/lib/db/models/Match';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Auth mock
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { matchId } = await req.json();

    const match = await Match.findOne({ _id: matchId, users: me._id });
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    // Extend timer by 24 hours
    const newExpiresAt = new Date(match.expiresAt.getTime() + 24 * 60 * 60 * 1000);
    
    match.expiresAt = newExpiresAt;
    await match.save();

    return NextResponse.json({ success: true, expiresAt: match.expiresAt });
  } catch (error: any) {
    console.error('Extend Match Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
