import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/connect';
import { Match } from '@/lib/db/models/Match';
import { Message } from '@/lib/db/models/Message';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    await connectToDatabase();
    
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { matchId } = await params;

    // Verify user is in this match
    const match = await Match.findOne({ _id: matchId, users: me._id });
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    const messages = await Message.find({ matchId }).sort({ createdAt: 1 });

    // Format for frontend
    const formatted = messages.map(msg => ({
      sender: msg.isAI ? 'ai' : (msg.senderId.toString() === me._id.toString() ? 'me' : 'them'),
      text: msg.text,
      createdAt: msg.createdAt
    }));

    return NextResponse.json({ success: true, messages: formatted });
  } catch (error: any) {
    console.error('Fetch Messages Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    await connectToDatabase();
    
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { matchId } = await params;
    const { text, isAI } = await req.json();

    // Verify user is in this match
    const match = await Match.findOne({ _id: matchId, users: me._id });
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    // Mark as initiated if it hasn't been yet, and I am the initiator
    if (!match.isInitiated && match.initiatorId.toString() === me._id.toString()) {
      match.isInitiated = true;
      await match.save();
    }

    const message = await Message.create({
      matchId,
      senderId: me._id,
      text,
      isAI: isAI || false
    });

    return NextResponse.json({ success: true, message: {
      sender: isAI ? 'ai' : 'me',
      text: message.text,
      createdAt: message.createdAt
    }});
  } catch (error: any) {
    console.error('Send Message Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
