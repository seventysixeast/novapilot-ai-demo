"use server";

import { revalidatePath } from "next/cache";

import { generateKnowledgeAnswer, ingestKnowledgeDocument } from "@/lib/documents/ingest";
import type {
  KnowledgeDocUploadState,
  KnowledgeSemanticSearchState,
  KnowledgeChunkSearchResult,
} from "@/lib/documents/types";
import { searchKnowledge } from "@/lib/ai/vector";
import { getCurrentMembership } from "@/lib/server/tenant";
import { createAdminClient } from "@/lib/supabase/server";

const INITIAL_UPLOAD_STATE: KnowledgeDocUploadState = {
  status: "idle",
  message: "",
};

const INITIAL_SEARCH_STATE: KnowledgeSemanticSearchState = {
  status: "idle",
  query: "",
  answer: "",
  confidence: 0,
  results: [],
  citations: [],
};

export async function ingestDocumentAction(
  _previousState: KnowledgeDocUploadState = INITIAL_UPLOAD_STATE,
  formData: FormData,
): Promise<KnowledgeDocUploadState> {
  void _previousState;
  const membership = await getCurrentMembership();
  if (!membership) {
    return { status: "error", message: "You must be signed in to ingest documents." };
  }

  try {
    const rawMode = String(formData.get("mode") ?? "upload").toLowerCase();
    const sourceType = rawMode === "note" ? "note" : rawMode === "paste" ? "paste" : "upload";
    const title = getValue(formData, "title") || getFallbackTitle(sourceType, formData);
    const rawText = getValue(formData, "content");
    const collectionName = getValue(formData, "collection_name");
    const sourceLabel = getValue(formData, "source_label");
    const sourceUri = getValue(formData, "source_uri");
    const tags = parseTags(getValue(formData, "tags"));
    const fileValue = formData.get("file");
    const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;

    const result = await ingestKnowledgeDocument({
      organizationId: membership.organizationId,
      userId: membership.userId,
      title,
      sourceType,
      sourceLabel: sourceLabel || undefined,
      collectionName: collectionName || undefined,
      tags,
      sourceUri: sourceUri || undefined,
      file,
      rawText,
      fileName: file?.name,
      mimeType: file?.type,
      fileExtension: file ? getFileExtension(file.name) : undefined,
    });

    revalidatePath("/dashboard/documents");

    return {
      status: "success",
      message: `Indexed ${result.chunkCount} chunk${result.chunkCount === 1 ? "" : "s"} from ${result.title}.`,
      documentId: result.documentId,
      documentTitle: result.title,
      chunkCount: result.chunkCount,
      summary: result.summary,
      warnings: result.warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Document ingestion failed.";
    return { status: "error", message };
  }
}

export async function runSemanticSearchAction(
  _previousState: KnowledgeSemanticSearchState = INITIAL_SEARCH_STATE,
  formData: FormData,
): Promise<KnowledgeSemanticSearchState> {
  void _previousState;
  const membership = await getCurrentMembership();
  if (!membership) {
    return {
      ...INITIAL_SEARCH_STATE,
      status: "error",
      message: "You must be signed in to search workspace knowledge.",
    };
  }

  const query = getValue(formData, "query").trim();
  if (!query) {
    return {
      ...INITIAL_SEARCH_STATE,
      status: "error",
      message: "Type a search query to retrieve relevant document chunks.",
    };
  }

  try {
    const matches = await searchKnowledge(query, membership.organizationId, 6);
    const answer = await generateKnowledgeAnswer(query, matches as KnowledgeChunkSearchResult[]);
    const citations = buildCitations(matches as KnowledgeChunkSearchResult[]);

    const supabase = await createAdminClient();
    await supabase.from("ai_queries").insert({
      organization_id: membership.organizationId,
      user_id: membership.userId,
      query_text: query,
      answer_text: answer.answer,
      confidence_score: answer.confidence,
      freshness_status: matches.length ? "fresh" : "unknown",
    });

    revalidatePath("/dashboard/documents");

    return {
      status: "success",
      query,
      answer: answer.answer,
      confidence: answer.confidence,
      results: matches as KnowledgeChunkSearchResult[],
      citations,
      message: matches.length
        ? `Retrieved ${matches.length} relevant chunk${matches.length === 1 ? "" : "s"}.`
        : "No document chunks matched closely enough for a grounded answer.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Knowledge search failed.";
    return {
      ...INITIAL_SEARCH_STATE,
      status: "error",
      query,
      message,
    };
  }
}

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseTags(value: string) {
  if (!value) return [];
  return value
    .split(/[,\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function getFileExtension(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() : undefined;
}

function getFallbackTitle(sourceType: "upload" | "paste" | "note", formData: FormData) {
  if (sourceType === "note") return "Untitled Note";
  if (sourceType === "paste") return "Pasted Knowledge";

  const file = formData.get("file");
  if (file instanceof File && file.name) {
    return file.name.replace(/\.[^.]+$/, "");
  }

  return "Untitled Document";
}

function buildCitations(results: KnowledgeChunkSearchResult[]) {
  const unique = new Map<string, KnowledgeSemanticSearchState["citations"][number]>();

  results.forEach((result, index) => {
    const metadata = result.metadata ?? {};
    const documentId = String(metadata.document_id ?? result.id);
    if (unique.has(documentId)) return;

    unique.set(documentId, {
      documentId,
      documentTitle: String(metadata.document_title ?? metadata.file_name ?? `Source ${index + 1}`),
      sourceLabel: String(metadata.source_label ?? "Knowledge Base"),
      collectionName: metadata.collection_name ? String(metadata.collection_name) : null,
      snippet: String(result.content).slice(0, 200),
      similarity: result.similarity,
      chunkIndex: Number(metadata.chunk_index ?? index + 1),
    });
  });

  return [...unique.values()].slice(0, 6);
}
