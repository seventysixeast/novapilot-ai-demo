export type KnowledgeDocumentStatus = "uploaded" | "processing" | "ready" | "failed";

export type KnowledgeDocumentSourceType = "upload" | "paste" | "note";

export type KnowledgeDocumentKind = "pdf" | "image" | "text";

export type KnowledgeDocumentRecord = {
  id: string;
  organization_id: string;
  collection_id: string | null;
  title: string;
  source_type: KnowledgeDocumentSourceType | string;
  source_label: string;
  kind: KnowledgeDocumentKind | string;
  file_name: string | null;
  file_extension: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  source_uri: string | null;
  status: KnowledgeDocumentStatus;
  ingestion_stage: string;
  embedding_status: string;
  index_status: string;
  progress: number;
  chunk_count: number;
  summary: string | null;
  key_insights: string[] | null;
  recommendations: string[] | null;
  confidence_score: number;
  tags: string[] | null;
  content_excerpt: string | null;
  last_error: string | null;
  created_by: string | null;
  created_at: string;
  processed_at: string | null;
  updated_at: string;
};

export type KnowledgeCollectionRecord = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
};

export type KnowledgeChunkSearchResult = {
  id: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
};

export type KnowledgeQueryLogRecord = {
  id: string;
  query_text: string;
  answer_text: string | null;
  confidence_score: number | null;
  freshness_status: string | null;
  created_at: string;
};

export type KnowledgeDocUploadState = {
  status: "idle" | "processing" | "success" | "error";
  message: string;
  documentId?: string;
  documentTitle?: string;
  chunkCount?: number;
  summary?: string;
  warnings?: string[];
};

export type KnowledgeSemanticSearchState = {
  status: "idle" | "searching" | "success" | "error";
  query: string;
  answer: string;
  confidence: number;
  results: KnowledgeChunkSearchResult[];
  citations: Array<{
    documentId: string;
    documentTitle: string;
    sourceLabel: string;
    collectionName: string | null;
    snippet: string;
    similarity: number;
    chunkIndex: number;
  }>;
  message?: string;
};
