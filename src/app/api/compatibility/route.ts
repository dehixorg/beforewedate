import { NextResponse, NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db/connect';
import { User } from '@/lib/db/models/User';
import { Profile } from '@/lib/db/models/Profile';
import { ConsentPolicy } from '@/lib/db/models/ConsentPolicy';
import { getCurrentUser } from '@/lib/auth';
import { evaluateDeterministicCompatibility } from '@/lib/compatibility/engine';
import { payAgentCall } from '@/lib/croo-cap/mockSdk';
import { AzureOpenAI } from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });
    }

    await connectToDatabase();

    // Auth mock
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Fetch Profiles
    const userAProfile = await Profile.findOne({ userId: me._id });
    const userBProfile = await Profile.findOne({ userId: targetUserId });
    
    // Fetch Consent Policies
    const userAConsent = await ConsentPolicy.findOne({ userId: me._id });
    const userBConsent = await ConsentPolicy.findOne({ userId: targetUserId });

    if (!userAProfile || !userBProfile || !userAConsent || !userBConsent) {
      return NextResponse.json({ error: 'Missing profiles or consent policies' }, { status: 404 });
    }

    // 1. Run Deterministic Engine (Compatibility Agent)
    const engineResult = evaluateDeterministicCompatibility({
      userAProfile,
      userBProfile,
      userAConsent,
      userBConsent
    });

    // 2. Mock payment for the primary agent
    const compatibilityPayment = await payAgentCall({
      agentName: 'CompatibilityAgent',
      methodName: 'evaluateCompatibility',
      amountUsdc: 0.50,
      userId: me._id.toString()
    });

    let coachQuestions: string[] = [];
    let coachPayment = null;
    let discussTopics = engineResult.conflicts.length > 0 ? engineResult.conflicts : ["long-term location plans"]; // Fallback if perfectly aligned

    // 3. A2A Composability: If eligible, call the Conversation Coach Agent (Azure OpenAI)
    if (engineResult.eligible) {
      try {
        const openai = new AzureOpenAI({
          endpoint: process.env.AZURE_OPENAI_ENDPOINT,
          apiKey: process.env.AZURE_OPENAI_API_KEY,
          apiVersion: process.env.AZURE_OPENAI_API_VERSION,
          deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        });

        const prompt = `You are an AI Conversation Coach agent. Two people have just matched anonymously.
They are aligned on: ${engineResult.alignedCategories.join(", ")}.
They have potential friction on: ${discussTopics.join(", ")}.
Provide exactly ONE engaging, safe, and emotionally intelligent ice-breaker question they can use to start a conversation about their alignment or friction. Do not include quotes or intro text, just the question.`;

        const completion = await openai.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: '', // Left blank as Azure SDK uses deployment name via env
        });

        const question = completion.choices[0]?.message?.content?.trim() || "What are you looking for in a relationship?";
        coachQuestions.push(question);

        // Mock payment for the dependent agent
        coachPayment = await payAgentCall({
          agentName: 'ConversationCoach',
          methodName: 'generateOpeningPrompts',
          amountUsdc: 0.10,
          userId: me._id.toString()
        });

      } catch (aiError) {
        console.error("OpenAI A2A Call Failed:", aiError);
        coachQuestions.push("I see we matched! What does healthy communication look like to you?");
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        id: targetUserId,
        eligible: engineResult.eligible,
        score: engineResult.alignmentScore,
        aligned: engineResult.alignedCategories,
        discuss: discussTopics,
        coachQuestions,
        transactions: {
          compatibilityPayment: compatibilityPayment.txHash,
          dependencyPayment: coachPayment?.txHash
        },
        reasoning: engineResult.reasoning
      }
    });

  } catch (error: any) {
    console.error('Compatibility Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
