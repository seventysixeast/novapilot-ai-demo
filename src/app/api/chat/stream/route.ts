import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/server/tenant";
import { searchKnowledge } from "@/lib/ai/vector";
import { aiRouter } from "@/lib/ai/router";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // 1. Session and Tenancy validation
    const membership = await getCurrentMembership();
    if (!membership) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { content, threadId: initialThreadId } = await req.json();
    if (!content) {
      return new NextResponse("Content is required", { status: 400 });
    }

    const supabase = await createClient();
    const adminClient = await createAdminClient();

    // 2. Ensure thread exists
    let threadId = initialThreadId;
    if (!threadId) {
      console.log("[STREAM CHAT] Creating new thread...");
      const { data: thread, error: threadError } = await adminClient
        .from("chat_threads")
        .insert({
          organization_id: membership.organizationId,
          created_by: membership.userId,
          title: content.slice(0, 40) + (content.length > 40 ? "..." : ""),
        })
        .select()
        .single();

      if (threadError || !thread) {
        console.error("[STREAM CHAT] Thread creation failed:", threadError);
        return new NextResponse("Thread creation failed", { status: 500 });
      }
      threadId = thread.id;
    }

    // 3. Save User Message
    const { error: userMsgError } = await adminClient.from("chat_messages").insert({
      thread_id: threadId,
      organization_id: membership.organizationId,
      role: "user",
      content,
    });

    if (userMsgError) {
      console.error("[STREAM CHAT] Failed to save user message:", userMsgError);
      return new NextResponse("Failed to save user message", { status: 500 });
    }

    // 4. Fetch Synced Sources Context
    const { data: connectedSources } = await supabase
      .from("data_connections")
      .select("provider, status, last_synced_at")
      .eq("organization_id", membership.organizationId);

    const freshSources = (connectedSources ?? []).filter(
      (s) => s.status === "connected" && s.last_synced_at && new Date(s.last_synced_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    // Fetch latest analytics metrics synced from Stripe/HubSpot/GA4
    const { data: latestMetrics } = await supabase
      .from("analytics_metrics")
      .select("metric_date, mrr, active_users, cac, ltv, anomaly_score, anomaly_description")
      .eq("organization_id", membership.organizationId)
      .order("metric_date", { ascending: false })
      .limit(7);

    const metricsContext = latestMetrics && latestMetrics.length > 0
      ? `\n\nLatest System Analytics Metrics (synced from Stripe/HubSpot/GA4):\n` +
        latestMetrics.map(m => `- Date: ${m.metric_date}, MRR: $${m.mrr}, Active Users: ${m.active_users}, CAC: $${m.cac || 0}, LTV: $${m.ltv || 0}${m.anomaly_description ? ` (Anomaly Alert: ${m.anomaly_description})` : ""}`).join('\n')
      : "\n\nSystem Analytics Metrics: No metrics synced yet. Recommend connecting Stripe, HubSpot, or Google Analytics 4.";

    // 5. Fetch previous conversation history for this thread
    const { data: threadMessages } = await adminClient
      .from("chat_messages")
      .select("role, content")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(12);

    let conversationHistory = "";
    if (threadMessages && threadMessages.length > 1) {
      const previousMessages = threadMessages.slice(0, -1);
      conversationHistory = "\n\nRecent Conversation History:\n" +
        previousMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    }

    // 6. Vector Search RAG context
    const knowledge = await searchKnowledge(content, membership.organizationId);
    const contextString = knowledge.length > 0 
      ? `\n\nContext from Knowledge Base:\n${knowledge.map(k => `- ${k.content}`).join('\n')}`
      : "";

    // 7. Construct Premium Prompt
    const promptText = `User Current Message: ${content}

${conversationHistory}
${contextString}
${metricsContext}

Rules:
1) Use the provided context and conversation history to construct your response.
2) If the user's question references past messages (using pronouns like "this", "it", "that", "earlier", "their", etc.), resolve them using the conversation history.
3) If no context or history is relevant, explain why.
4) Professional tone.
5) Always reference the synced analytics metrics (like MRR, Active Users, LTV, CAC) when asked about growth, pipeline performance, anomalies, or system metrics.
6) If the user asks you to send an email or outbound message (e.g. "Send email to bh@hubspot.com about payment success" or "bh@hubspot.com ko email bhej do that payment is done"), you MUST generate a highly personalized and professional email subject and body dynamically using the available user context, and output it in this exact action block format:
   [ACTION_EMAIL: TO=recipient_email | SUBJECT=Subject | BODY=Body Content]
   Do NOT use markdown inside the action block tag itself. You can add friendly conversational introduction text before the block.`;

    // 8. Generate Stream (or use cached response)
    const { getQuestionCache, setQuestionCache } = await import("@/lib/ai/cache");
    const cachedAnswer = await getQuestionCache(membership.organizationId, content, adminClient);

    let reader: ReadableStreamDefaultReader<any> | null = null;
    if (!cachedAnswer) {
      const rawStream = await aiRouter.generateStream(promptText, "PREMIUM");
      reader = rawStream.getReader();
    }
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    // 9. Return clean text stream and asynchronously insert into Postgres on finish
    const responseStream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        let fullResponseText = "";

        // First, enqueue metadata about the thread ID so the client knows it (especially for brand new chats)
        controller.enqueue(encoder.encode(`__THREAD_ID__:${threadId}\n`));

        if (cachedAnswer) {
          try {
            // Give client time to consume the thread ID first
            await new Promise(resolve => setTimeout(resolve, 50));

            // Stream the cached answer back in chunks with a tiny delay to simulate ultra-fast typing
            const chunkSize = 32;
            for (let i = 0; i < cachedAnswer.length; i += chunkSize) {
              controller.enqueue(encoder.encode(cachedAnswer.slice(i, i + chunkSize)));
              await new Promise(resolve => setTimeout(resolve, 10));
            }
            controller.close();

            // Asynchronously log the cached response in thread history
            const { data: aiQuery } = await adminClient
              .from("ai_queries")
              .insert({
                organization_id: membership.organizationId,
                user_id: membership.userId,
                thread_id: threadId,
                query_text: content,
                answer_text: cachedAnswer,
                confidence_score: 95,
                freshness_status: "fresh"
              })
              .select()
              .single();

            await adminClient.from("chat_messages").insert({
              thread_id: threadId,
              organization_id: membership.organizationId,
              role: "assistant",
              content: cachedAnswer,
            });

            if (aiQuery && (freshSources.length > 0 || knowledge.length > 0)) {
              const citations = knowledge.map(k => ({
                provider: k.metadata.source_type || 'knowledge',
                sourceRef: k.metadata.source_id || 'internal',
                freshnessAt: k.metadata.last_synced_at || null
              }));

              const allCitations = [
                ...freshSources.map(s => ({
                  ai_query_id: aiQuery.id,
                  organization_id: membership.organizationId,
                  provider: s.provider,
                  source_ref: "latest_sync",
                  freshness_at: s.last_synced_at
                })),
                ...citations.map(c => ({
                  ai_query_id: aiQuery.id,
                  organization_id: membership.organizationId,
                  provider: c.provider,
                  source_ref: c.sourceRef,
                  freshness_at: c.freshnessAt
                }))
              ];
              await adminClient.from("ai_query_citations").insert(allCitations);
            }

            // Live Resend Email Dispatch for Cache hits
            const emailMatch = cachedAnswer.match(/\[ACTION_EMAIL:\s*TO=([^|]+)\|\s*SUBJECT=([^|]+)\|\s*BODY=([\s\S]+?)\]/i);
            if (emailMatch) {
              const toEmail = emailMatch[1].trim();
              const mailSubject = emailMatch[2].trim();
              const mailBody = emailMatch[3].trim();

              if (process.env.RESEND_API_KEY) {
                try {
                  const { Resend } = require("resend");
                  const resend = new Resend(process.env.RESEND_API_KEY);
                  await resend.emails.send({
                    from: "NovaPilot AI <onboarding@resend.dev>",
                    to: toEmail,
                    subject: mailSubject,
                    text: mailBody,
                  });
                  console.log(`[RESEND CACHE SUCCESS]: Outbound email sent successfully to ${toEmail}`);
                } catch (resendError) {
                  console.error("[RESEND CACHE DISPATCH ERROR]:", resendError);
                }
              }
            }

          } catch (cachedLogError) {
            console.error("[STREAM CHAT] Failed to log cached response:", cachedLogError);
          }
          return;
        }

        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              if (trimmed === "data: [DONE]") continue;

              if (trimmed.startsWith("data: ")) {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  const contentChunk = data.choices?.[0]?.delta?.content || "";
                  if (contentChunk) {
                    fullResponseText += contentChunk;
                    controller.enqueue(encoder.encode(contentChunk));
                  }
                } catch (err) {
                  // Ignore parse errors
                }
              } else {
                // For mock / direct text streams
                fullResponseText += line + "\n";
                controller.enqueue(encoder.encode(line + "\n"));
              }
            }
          }

          // Enqueue remaining buffer if any
          if (buffer) {
            if (buffer.startsWith("data: ")) {
              try {
                const data = JSON.parse(buffer.slice(6));
                const contentChunk = data.choices?.[0]?.delta?.content || "";
                if (contentChunk) {
                  fullResponseText += contentChunk;
                  controller.enqueue(encoder.encode(contentChunk));
                }
              } catch (e) {}
            } else {
              fullResponseText += buffer;
              controller.enqueue(encoder.encode(buffer));
            }
          }

          controller.close();

          // 10. Async Database Logging on Stream Completion
          if (fullResponseText.trim()) {
            // Cache the newly generated answer
            setQuestionCache(membership.organizationId, content, fullResponseText);

            const { data: aiQuery } = await adminClient
              .from("ai_queries")
              .insert({
                organization_id: membership.organizationId,
                user_id: membership.userId,
                thread_id: threadId,
                query_text: content,
                answer_text: fullResponseText,
                confidence_score: 95,
                freshness_status: "fresh"
              })
              .select()
              .single();

            await adminClient.from("chat_messages").insert({
              thread_id: threadId,
              organization_id: membership.organizationId,
              role: "assistant",
              content: fullResponseText,
            });

            // Citations
            const citations = knowledge.map(k => ({
              provider: k.metadata.source_type || 'knowledge',
              sourceRef: k.metadata.source_id || 'internal',
              freshnessAt: k.metadata.last_synced_at || null
            }));

            if (aiQuery && (freshSources.length > 0 || citations.length > 0)) {
              const allCitations = [
                ...freshSources.map(s => ({
                  ai_query_id: aiQuery.id,
                  organization_id: membership.organizationId,
                  provider: s.provider,
                  source_ref: "latest_sync",
                  freshness_at: s.last_synced_at
                })),
                ...citations.map(c => ({
                  ai_query_id: aiQuery.id,
                  organization_id: membership.organizationId,
                  provider: c.provider,
                  source_ref: c.sourceRef,
                  freshness_at: c.freshnessAt
                }))
              ];
              await adminClient.from("ai_query_citations").insert(allCitations);
            }

            // Estimate usage tokens (approx 1 word = 1.3 tokens)
            const inputTokens = Math.ceil(promptText.split(/\s+/).length * 1.3);
            const outputTokens = Math.ceil(fullResponseText.split(/\s+/).length * 1.3);

            await adminClient.from("ai_usage_logs").insert({
              organization_id: membership.organizationId,
              user_id: membership.userId,
              provider: "router",
              model: "dynamic",
              prompt_tokens: inputTokens,
              completion_tokens: outputTokens,
            });

            // Live Resend Email Dispatch for Stream completions
            const emailMatch = fullResponseText.match(/\[ACTION_EMAIL:\s*TO=([^|]+)\|\s*SUBJECT=([^|]+)\|\s*BODY=([\s\S]+?)\]/i);
            if (emailMatch) {
              const toEmail = emailMatch[1].trim();
              const mailSubject = emailMatch[2].trim();
              const mailBody = emailMatch[3].trim();

              if (process.env.RESEND_API_KEY) {
                try {
                  const { Resend } = require("resend");
                  const resend = new Resend(process.env.RESEND_API_KEY);
                  await resend.emails.send({
                    from: "NovaPilot AI <onboarding@resend.dev>",
                    to: toEmail,
                    subject: mailSubject,
                    text: mailBody,
                  });
                  console.log(`[RESEND SUCCESS]: Outbound email sent successfully to ${toEmail}`);
                } catch (resendError) {
                  console.error("[RESEND DISPATCH ERROR]:", resendError);
                }
              } else {
                console.log(`[RESEND NOTICE]: Setup process.env.RESEND_API_KEY to send live to ${toEmail}`);
              }
            }
          }
        } catch (streamError) {
          console.error("[STREAM CHAT] Stream Processing Error:", streamError);
          controller.error(streamError);
        }
      }
    });

    return new NextResponse(responseStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("[STREAM CHAT] API Endpoint Failure:", error);
    return new NextResponse(JSON.stringify({ error: "Streaming chat failed" }), { status: 500 });
  }
}
