import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/connect';
import { User } from '@/lib/db/models/User';
import { Match } from '@/lib/db/models/Match';
import { Profile } from '@/lib/db/models/Profile';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Auth mock
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Find all matches where I am one of the users
    const matches = await Match.find({ users: me._id }).sort({ createdAt: -1 });

    const results = [];

    for (const match of matches) {
      // Find the ID of the other user
      const otherUserId = match.users.find(id => id.toString() !== me._id.toString());
      if (!otherUserId) continue;

      const profile = await Profile.findOne({ userId: otherUserId });
      if (!profile) continue;

      results.push({
        matchId: match._id,
        userId: otherUserId.toString(),
        alias: `Anonymous Match #${otherUserId.toString().substring(18)}`,
        photo: profile.photos?.[0] || null, // First photo for the avatar
        matchedAt: match.createdAt,
        expiresAt: match.expiresAt,
        isInitiated: match.isInitiated,
        isInitiator: match.initiatorId.toString() === me._id.toString(),
      });
    }

    return NextResponse.json({ success: true, matches: results });
  } catch (error: any) {
    console.error('Matches Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
