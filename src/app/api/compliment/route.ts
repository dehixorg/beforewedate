import { NextResponse, NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db/connect';
import { Compliment } from '@/lib/db/models/Compliment';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { targetUserId, message } = await req.json();

    if (!targetUserId || !message) {
      return NextResponse.json({ error: 'Missing targetUserId or message' }, { status: 400 });
    }

    await connectToDatabase();

    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Save the compliment to MongoDB
    await Compliment.create({
      senderId: me._id,
      targetId: targetUserId,
      message,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Compliment Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
