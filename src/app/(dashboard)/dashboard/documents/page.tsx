import { getAIRouterConfig } from "@/lib/ai/config";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/server/tenant";
import type {
  KnowledgeCollectionRecord,
  KnowledgeDocumentRecord,
  KnowledgeQueryLogRecord,
} from "@/lib/documents/types";

import { DocumentsWorkspace } from "./documents-workspace";

export default async function DocumentsPage() {
  const membership = await getCurrentMembership();
  const routerConfig = await getAIRouterConfig();
  const supabase = await createClient();

  let documents: Array<KnowledgeDocumentRecord & { collectionName: string | null; collectionColor: string | null }> = [];
  let collections: Array<KnowledgeCollectionRecord & { documentCount: number }> = [];
  let recentQueries: KnowledgeQueryLogRecord[] = [];

  if (membership) {
    const [documentResult, collectionResult, queryResult, chunkCountResult] = await Promise.all([
      supabase
        .from("knowledge_documents")
        .select("*")
        .eq("organization_id", membership.organizationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("knowledge_collections")
        .select("*")
        .eq("organization_id", membership.organizationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("ai_queries")
        .select("id, query_text, answer_text, confidence_score, freshness_status, created_at")
        .eq("organization_id", membership.organizationId)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("knowledge_chunks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", membership.organizationId),
    ]);

    const documentRows = (documentResult.data ?? []) as KnowledgeDocumentRecord[];
    const collectionRows = (collectionResult.data ?? []) as KnowledgeCollectionRecord[];
    const queryRows = (queryResult.data ?? []) as KnowledgeQueryLogRecord[];
    const totalChunks = chunkCountResult.count ?? 0;

    const collectionCountById = documentRows.reduce<Record<string, number>>((accumulator, document) => {
      if (!document.collection_id) return accumulator;
      accumulator[document.collection_id] = (accumulator[document.collection_id] ?? 0) + 1;
      return accumulator;
    }, {});

    const collectionMap = new Map(collectionRows.map((collection) => [collection.id, collection]));

    documents = documentRows.map((document) => {
      const collection = document.collection_id ? collectionMap.get(document.collection_id) ?? null : null;
      return {
        ...document,
        collectionName: collection?.name ?? null,
        collectionColor: collection?.color ?? null,
      };
    });

    collections = collectionRows.map((collection) => ({
      ...collection,
      documentCount: collectionCountById[collection.id] ?? 0,
    }));

    recentQueries = queryRows;

    const readyDocuments = documents.filter((document) => document.status === "ready").length;
    const processingDocuments = documents.filter((document) => document.status === "processing").length;
    const failedDocuments = documents.filter((document) => document.status === "failed").length;
    const averageConfidence = documents.length
      ? Math.round(documents.reduce((sum, document) => sum + (document.confidence_score ?? 0), 0) / documents.length)
      : 0;

    const sourceGroups = groupSources(documents);

    return (
      <DocumentsWorkspace
        documents={documents}
        collections={collections}
        sourceSummaries={sourceGroups}
        recentQueries={recentQueries}
        stats={{
          totalDocuments: documents.length,
          readyDocuments,
          processingDocuments,
          failedDocuments,
          totalChunks,
          averageConfidence,
          collectionCount: collections.length,
          sourceCount: sourceGroups.length,
        }}
        routerConfig={routerConfig}
      />
    );
  }

  return (
    <DocumentsWorkspace
      documents={documents}
      collections={collections}
      sourceSummaries={[]}
      recentQueries={recentQueries}
      stats={{
        totalDocuments: 0,
        readyDocuments: 0,
        processingDocuments: 0,
        failedDocuments: 0,
        totalChunks: 0,
        averageConfidence: 0,
        collectionCount: 0,
        sourceCount: 0,
      }}
      routerConfig={routerConfig}
    />
  );
}

function groupSources(
  documents: Array<KnowledgeDocumentRecord & { collectionName: string | null; collectionColor: string | null }>,
) {
  const palette: Record<string, string> = {
    upload: "border-sky-100 bg-sky-50 text-sky-700",
    paste: "border-violet-100 bg-violet-50 text-violet-700",
    note: "border-emerald-100 bg-emerald-50 text-emerald-700",
  };

  const groups = new Map<
    string,
    {
      key: string;
      label: string;
      count: number;
      readyCount: number;
      processingCount: number;
      failedCount: number;
      latestAt: string | null;
      color: string;
    }
  >();

  documents.forEach((document) => {
    const key = document.source_type || "upload";
    const current = groups.get(key) ?? {
      key,
      label: key === "upload" ? "Uploaded Files" : key === "paste" ? "Pasted Text" : "Notes",
      count: 0,
      readyCount: 0,
      processingCount: 0,
      failedCount: 0,
      latestAt: null,
      color: palette[key] ?? "border-slate-100 bg-slate-50 text-slate-700",
    };

    current.count += 1;
    if (document.status === "ready") current.readyCount += 1;
    if (document.status === "processing") current.processingCount += 1;
    if (document.status === "failed") current.failedCount += 1;
    if (!current.latestAt || document.created_at > current.latestAt) {
      current.latestAt = document.created_at;
    }

    groups.set(key, current);
  });

  return [...groups.values()].map((group) => ({
    ...group,
    latestAt: group.latestAt ? new Date(group.latestAt).toLocaleString() : null,
  }));
}
