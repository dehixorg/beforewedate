import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/connect';
import { Interaction } from '@/lib/db/models/Interaction';
import { Match } from '@/lib/db/models/Match';
import { Profile } from '@/lib/db/models/Profile';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Auth mock
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { targetUserId, action } = await req.json(); // action = 'like' | 'pass' | 'superlike'
    
    if (!['like', 'pass', 'superlike'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // 1. Record interaction
    await Interaction.findOneAndUpdate(
      { fromUserId: me._id, toUserId: targetUserId },
      { action },
      { upsert: true, new: true }
    );

    let isMatch = false;

    // 2. Check for mutual match if it's a like or superlike
    if (action === 'like' || action === 'superlike') {
      const mutualInteraction = await Interaction.findOne({
        fromUserId: targetUserId,
        toUserId: me._id,
        action: { $in: ['like', 'superlike'] }
      });

      if (mutualInteraction) {
        // We have a match! 
        isMatch = true;

        // Bumble First Move Algorithm
        const myProfile = await Profile.findOne({ userId: me._id });
        const targetProfile = await Profile.findOne({ userId: targetUserId });

        let initiatorId = me._id; // Default: person who completes the match

        if (myProfile && targetProfile) {
          const myGender = myProfile.gender.toLowerCase();
          const targetGender = targetProfile.gender.toLowerCase();

          if (myGender === 'female' && targetGender !== 'female') {
            initiatorId = me._id;
          } else if (targetGender === 'female' && myGender !== 'female') {
            initiatorId = targetUserId;
          }
        }

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

        await Match.findOneAndUpdate(
          { users: { $all: [me._id, targetUserId] } },
          { 
            users: [me._id, targetUserId],
            expiresAt,
            initiatorId,
            isInitiated: false
          },
          { upsert: true, new: true }
        );
      }
    }

    return NextResponse.json({ success: true, isMatch });
  } catch (error: any) {
    console.error('Interact Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
