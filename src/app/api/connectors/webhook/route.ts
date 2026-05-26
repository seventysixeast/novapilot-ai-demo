import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type WebhookPayload = {
  provider?: "stripe" | "hubspot" | "ga4";
  eventId?: string;
  organizationId?: string;
  connectionId?: string;
};

export async function POST(request: NextRequest) {
  let payload: WebhookPayload;
  try {
    payload = (await request.json()) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const provider = payload.provider;
  const eventId = payload.eventId;
  const organizationId = payload.organizationId;
  const connectionId = payload.connectionId;

  if (!provider || !eventId || !organizationId || !connectionId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const idempotencyKey = `${provider}:${eventId}`;

  const { data: existingJob } = await supabase
    .from("sync_jobs")
    .select("id, status")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingJob) {
    return NextResponse.json({ ok: true, deduplicated: true, status: existingJob.status });
  }

  const { error: jobError } = await supabase.from("sync_jobs").insert({
    organization_id: organizationId,
    connection_id: connectionId,
    provider,
    idempotency_key: idempotencyKey,
    status: "queued",
    attempts: 0,
  });

  if (jobError) {
    return NextResponse.json({ error: "Failed to queue sync job" }, { status: 500 });
  }

  await supabase
    .from("data_connections")
    .update({
      status: "syncing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .eq("organization_id", organizationId);

  return NextResponse.json({ ok: true, queued: true });
}
