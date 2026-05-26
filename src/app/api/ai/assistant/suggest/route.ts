import { NextResponse } from 'next/server';
import { suggestNextAction } from '@/lib/ai/assistant';
import { getCurrentMembership } from '@/lib/server/tenant';
import { requireAIQuota } from '@/lib/server/gate';

export async function POST(req: Request) {
  try {
    const membership = await getCurrentMembership();
    if (!membership) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    await requireAIQuota();

    const { context } = await req.json();
    const response = await suggestNextAction(context);

    return NextResponse.json({
      text: response.text,
      provider: response.provider,
      model: response.model
    });
  } catch (error) {
    console.error('AI Suggestion Error:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
