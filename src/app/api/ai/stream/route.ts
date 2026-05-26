import { NextRequest, NextResponse } from "next/server";
import { aiRouter } from "@/lib/ai/router";
import { getCurrentMembership } from "@/lib/server/tenant";
import { requireAIQuota } from "@/lib/server/gate";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const membership = await getCurrentMembership();
    if (!membership) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    await requireAIQuota();

    const { prompt, category = "LIGHTWEIGHT", model } = await req.json();

    const stream = await aiRouter.generateStream(prompt, category, { forceModel: model });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Streaming AI Error:", error);
    return new NextResponse(JSON.stringify({ error: "Streaming failed" }), { status: 500 });
  }
}
