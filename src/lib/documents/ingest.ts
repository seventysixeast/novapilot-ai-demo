import { aiRouter } from "@/lib/ai/router";
import { createAdminClient } from "@/lib/supabase/server";
import type {
  KnowledgeChunkSearchResult,
  KnowledgeCollectionRecord,
  KnowledgeDocumentKind,
  KnowledgeDocumentSourceType,
} from "./types";

type DocumentIntelligence = {
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  confidence: number;
};

type IngestInput = {
  organizationId: string;
  userId: string;
  title: string;
  sourceType: KnowledgeDocumentSourceType;
  sourceLabel?: string;
  collectionName?: string;
  tags?: string[];
  sourceUri?: string;
  file?: File | null;
  rawText?: string;
  fileName?: string;
  mimeType?: string;
  fileExtension?: string;
};

const MAX_CHUNK_LENGTH = 1_400;
const MAX_SUMMARY_EXCERPT = 9_000;
const MAX_DOCX_BYTES = 25 * 1024 * 1024;

export async function ingestKnowledgeDocument(input: IngestInput) {
  const supabase = await createAdminClient();
  const documentId = crypto.randomUUID();
  const collectionName = normalizeCollectionName(input.collectionName);
  const fileName = input.fileName ?? input.file?.name ?? null;
  const mimeType = input.mimeType ?? input.file?.type ?? null;
  const fileExtension = input.fileExtension ?? inferExtension(fileName);
  const kind = inferDocumentKind(fileExtension, mimeType);
  const sourceLabel = input.sourceLabel ?? inferSourceLabel(input.sourceType, fileName, input.title);
  const tags = normalizeTags(input.tags ?? []);

  const { collection } = await ensureCollection(supabase, input.organizationId, collectionName);
  const extracted = await extractDocumentText({
    file: input.file,
    rawText: input.rawText ?? "",
    fileName,
    mimeType,
    fileExtension,
  });

  const text = normalizeText(extracted.text || input.rawText || "");
  if (!text.trim()) {
    throw new Error("No readable document text was found. Upload a text-based PDF, DOCX, TXT, Markdown, CSV, or paste content directly.");
  }

  const chunks = buildChunks(text, kind);
  if (!chunks.length) {
    throw new Error("The document could not be chunked for indexing.");
  }

  await upsertDocument(supabase, {
    id: documentId,
    organization_id: input.organizationId,
    collection_id: collection?.id ?? null,
    title: input.title,
    source_type: input.sourceType,
    source_label: sourceLabel,
    kind,
    file_name: fileName,
    file_extension: fileExtension,
    mime_type: mimeType,
    file_size_bytes: input.file?.size ?? null,
    source_uri: input.sourceUri ?? null,
    status: "processing",
    ingestion_stage: "extracting",
    embedding_status: "pending",
    index_status: "pending",
    progress: 12,
    chunk_count: 0,
    summary: null,
    key_insights: [],
    recommendations: [],
    confidence_score: 0,
    tags,
    content_excerpt: text.slice(0, 800),
    last_error: null,
    created_by: input.userId,
    processed_at: null,
    updated_at: new Date().toISOString(),
  });

  const intelligence = await generateDocumentIntelligence({
    title: input.title,
    text,
    kind,
    sourceLabel,
    fileName,
    collectionName: collection?.name ?? collectionName,
    tags,
  });

  await upsertDocument(supabase, {
    id: documentId,
    organization_id: input.organizationId,
    collection_id: collection?.id ?? null,
    title: input.title,
    source_type: input.sourceType,
    source_label: sourceLabel,
    kind,
    file_name: fileName,
    file_extension: fileExtension,
    mime_type: mimeType,
    file_size_bytes: input.file?.size ?? null,
    source_uri: input.sourceUri ?? null,
    status: "processing",
    ingestion_stage: "chunking",
    embedding_status: "pending",
    index_status: "pending",
    progress: 36,
    chunk_count: 0,
    summary: intelligence.summary,
    key_insights: intelligence.keyInsights,
    recommendations: intelligence.recommendations,
    confidence_score: intelligence.confidence,
    tags,
    content_excerpt: text.slice(0, 800),
    last_error: null,
    created_by: input.userId,
    processed_at: null,
    updated_at: new Date().toISOString(),
  });

  const chunkRows = await Promise.all(
    chunks.map(async (chunk, index) => {
      const embedding = await aiRouter.generateEmbedding(chunk);
      return {
        organization_id: input.organizationId,
        source_type: "document",
        source_id: documentId,
        content: chunk,
        metadata: {
          document_id: documentId,
          document_title: input.title,
          collection_id: collection?.id ?? null,
          collection_name: collection?.name ?? collectionName,
          source_label: sourceLabel,
          source_type: input.sourceType,
          file_name: fileName,
          file_extension: fileExtension,
          mime_type: mimeType,
          kind,
          chunk_index: index + 1,
          chunk_count: chunks.length,
          tags,
          extraction_mode: extracted.mode,
        },
        embedding: embedding.embedding,
      };
    }),
  );

  await upsertDocument(supabase, {
    id: documentId,
    organization_id: input.organizationId,
    collection_id: collection?.id ?? null,
    title: input.title,
    source_type: input.sourceType,
    source_label: sourceLabel,
    kind,
    file_name: fileName,
    file_extension: fileExtension,
    mime_type: mimeType,
    file_size_bytes: input.file?.size ?? null,
    source_uri: input.sourceUri ?? null,
    status: "processing",
    ingestion_stage: "indexing",
    embedding_status: "running",
    index_status: "running",
    progress: 70,
    chunk_count: chunks.length,
    summary: intelligence.summary,
    key_insights: intelligence.keyInsights,
    recommendations: intelligence.recommendations,
    confidence_score: intelligence.confidence,
    tags,
    content_excerpt: text.slice(0, 800),
    last_error: null,
    created_by: input.userId,
    processed_at: null,
    updated_at: new Date().toISOString(),
  });

  const { error: chunkError } = await supabase.from("knowledge_chunks").insert(chunkRows);
  if (chunkError) {
    await markDocumentFailed(supabase, documentId, input.organizationId, `Chunk indexing failed: ${chunkError.message}`);
    throw new Error(`Chunk indexing failed: ${chunkError.message}`);
  }

  await upsertDocument(supabase, {
    id: documentId,
    organization_id: input.organizationId,
    collection_id: collection?.id ?? null,
    title: input.title,
    source_type: input.sourceType,
    source_label: sourceLabel,
    kind,
    file_name: fileName,
    file_extension: fileExtension,
    mime_type: mimeType,
    file_size_bytes: input.file?.size ?? null,
    source_uri: input.sourceUri ?? null,
    status: "ready",
    ingestion_stage: "ready",
    embedding_status: "complete",
    index_status: "complete",
    progress: 100,
    chunk_count: chunks.length,
    summary: intelligence.summary,
    key_insights: intelligence.keyInsights,
    recommendations: intelligence.recommendations,
    confidence_score: intelligence.confidence,
    tags,
    content_excerpt: text.slice(0, 800),
    last_error: null,
    created_by: input.userId,
    processed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return {
    documentId,
    title: input.title,
    collectionId: collection?.id ?? null,
    collectionName: collection?.name ?? collectionName,
    sourceLabel,
    sourceType: input.sourceType,
    kind,
    chunkCount: chunks.length,
    summary: intelligence.summary,
    keyInsights: intelligence.keyInsights,
    recommendations: intelligence.recommendations,
    confidence: intelligence.confidence,
    warnings: extracted.warnings,
  };
}

export async function generateKnowledgeAnswer(query: string, results: KnowledgeChunkSearchResult[]) {
  if (!results.length) {
    return {
      answer:
        "No indexed document chunks matched this query yet. Upload or paste a document to seed the workspace, then ask again.",
      confidence: 0,
    };
  }

  const context = results
    .map((result, index) => {
      const metadata = result.metadata ?? {};
      const title = metadata.document_title ?? metadata.file_name ?? `Source ${index + 1}`;
      const collectionName = metadata.collection_name ? `Collection: ${metadata.collection_name}` : "Collection: Unassigned";
      return `Source ${index + 1}: ${title}\n${collectionName}\nChunk: ${metadata.chunk_index ?? index + 1}/${metadata.chunk_count ?? results.length}\nSimilarity: ${(result.similarity * 100).toFixed(1)}%\nContent:\n${result.content}`;
    })
    .join("\n\n");

  const response = await aiRouter.generateCompletion(
    [
      "You are answering questions with strict document-grounded retrieval.",
      "Use only the supplied context and call out when evidence is incomplete.",
      "Return a concise answer with short bullet points when useful.",
      `Question: ${query}`,
      `Context:\n${context.slice(0, MAX_SUMMARY_EXCERPT)}`,
    ].join("\n\n"),
    results.length > 4 ? "PREMIUM" : "LIGHTWEIGHT",
  );

  const confidence = Math.min(
    98,
    Math.max(42, Math.round(results[0] ? results[0].similarity * 100 : 0) + Math.min(results.length * 4, 16)),
  );

  return {
    answer: response.text.trim(),
    confidence,
  };
}

async function ensureCollection(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  organizationId: string,
  collectionName: string,
) {
  if (!collectionName) {
    return { collection: null as KnowledgeCollectionRecord | null };
  }

  const { data, error } = await supabase
    .from("knowledge_collections")
    .upsert(
      {
        organization_id: organizationId,
        name: collectionName,
        description: `Auto-managed collection for ${collectionName}`,
        color: pickCollectionColor(collectionName),
      },
      { onConflict: "organization_id,name" },
    )
    .select("id, organization_id, name, description, color, created_at")
    .single();

  if (error) {
    throw new Error(`Collection management failed: ${error.message}`);
  }

  return { collection: data as KnowledgeCollectionRecord };
}

async function upsertDocument(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  document: Record<string, unknown>,
) {
  const { error } = await supabase.from("knowledge_documents").upsert(document, {
    onConflict: "id",
  });

  if (error) {
    throw new Error(`Document persistence failed: ${error.message}`);
  }
}

async function markDocumentFailed(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  documentId: string,
  organizationId: string,
  message: string,
) {
  await supabase
    .from("knowledge_documents")
    .update({
      status: "failed",
      ingestion_stage: "failed",
      embedding_status: "failed",
      index_status: "failed",
      progress: 100,
      last_error: message,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("organization_id", organizationId);
}

async function generateDocumentIntelligence(input: {
  title: string;
  text: string;
  kind: KnowledgeDocumentKind;
  sourceLabel: string;
  fileName: string | null;
  collectionName: string;
  tags: string[];
}): Promise<DocumentIntelligence> {
  const prompt = [
    "You are a document intelligence assistant for a RAG knowledge workspace.",
    "Analyze the document using only the supplied content.",
    "Return a compact JSON object with these keys: summary, keyInsights, recommendations, confidence.",
    "Rules:",
    "- summary must be 2 sentences maximum.",
    "- keyInsights must be an array of 3 to 5 short phrases.",
    "- recommendations must be an array of 2 to 4 concrete next steps.",
    "- confidence must be a number from 0 to 100.",
    "",
    `Title: ${input.title}`,
    `Collection: ${input.collectionName}`,
    `Source label: ${input.sourceLabel}`,
    `File name: ${input.fileName ?? "n/a"}`,
    `Kind: ${input.kind}`,
    `Tags: ${input.tags.join(", ") || "none"}`,
    "",
    "Content:",
    input.text.slice(0, MAX_SUMMARY_EXCERPT),
  ].join("\n");

  try {
    const response = await aiRouter.generateCompletion(prompt, input.text.length > 5_000 ? "PREMIUM" : "LIGHTWEIGHT");
  const parsed = extractJsonObject(response.text);
    if (parsed) {
      return {
        summary: coerceText(parsed.summary, fallbackSummary(input.text)),
        keyInsights: coerceList(parsed.keyInsights ?? parsed.key_insights, fallbackInsights(input.text)),
        recommendations: coerceList(parsed.recommendations, fallbackRecommendations(input.text)),
        confidence: clampConfidence(parsed.confidence, fallbackConfidence(input.text)),
      };
    }
  } catch (error) {
    console.warn("[DOCS] Intelligence generation failed, using heuristic fallback:", error);
  }

  return {
    summary: fallbackSummary(input.text),
    keyInsights: fallbackInsights(input.text),
    recommendations: fallbackRecommendations(input.text),
    confidence: fallbackConfidence(input.text),
  };
}

async function extractDocumentText(input: {
  file?: File | null;
  rawText: string;
  fileName: string | null;
  mimeType: string | null;
  fileExtension: string | null;
}): Promise<{ text: string; mode: string; warnings: string[] }> {
  const warnings: string[] = [];

  if (input.rawText.trim()) {
    return { text: input.rawText, mode: "pasted-text", warnings };
  }

  const file = input.file;
  if (!file) {
    return { text: "", mode: "empty", warnings };
  }

  const extension = (input.fileExtension ?? inferExtension(input.fileName) ?? "").toLowerCase();
  const mime = (input.mimeType ?? file.type ?? "").toLowerCase();

  if (mime.startsWith("text/") || ["txt", "md", "markdown", "csv", "json", "log"].includes(extension)) {
    return { text: await file.text(), mode: "plain-text", warnings };
  }

  if (extension === "docx" || mime.includes("wordprocessingml")) {
    const text = await extractDocxText(file);
    if (text.trim()) {
      return { text, mode: "docx", warnings };
    }
    warnings.push("DOCX extraction returned no readable text.");
  }

  if (extension === "pdf" || mime === "application/pdf") {
    const text = await extractPdfText(file);
    if (text.trim()) {
      return { text, mode: "pdf", warnings };
    }
    warnings.push("PDF extraction returned no readable text.");
  }

  const fallback = await file.text();
  if (fallback.trim()) {
    warnings.push("Fell back to raw file text extraction.");
  }
  return { text: fallback, mode: "fallback", warnings };
}

async function extractDocxText(file: File) {
  if (file.size > MAX_DOCX_BYTES) {
    throw new Error("DOCX file is too large to process in-browser.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const entries = parseZipEntries(bytes);
  const documentParts = entries.filter((entry) => entry.name === "word/document.xml" || entry.name.startsWith("word/header") || entry.name.startsWith("word/footer"));

  if (!documentParts.length) {
    return "";
  }

  const parts = await Promise.all(
    documentParts.map(async (entry) => {
      const xmlBytes = await readZipEntry(bytes, entry);
      const xml = new TextDecoder().decode(xmlBytes);
      return extractXmlText(xml);
    }),
  );

  return normalizeText(parts.filter(Boolean).join("\n\n"));
}

async function extractPdfText(file: File) {
  const raw = new TextDecoder("latin1").decode(await file.arrayBuffer());
  const matches: string[] = [];

  for (const match of raw.matchAll(/\((?:\\.|[^()]){1,200}\)\s*T[Jj]/g)) {
    const literal = match[0].replace(/\s*T[Jj]$/, "");
    matches.push(unescapePdfLiteral(literal.slice(1, -1)));
  }

  for (const match of raw.matchAll(/<([0-9A-Fa-f]+)>\s*T[Jj]/g)) {
    matches.push(hexToPdfText(match[1]));
  }

  if (!matches.length) {
    for (const match of raw.matchAll(/BT([\s\S]{0,400}?)ET/g)) {
      const block = match[1];
      for (const literal of block.matchAll(/\((?:\\.|[^()]){1,200}\)/g)) {
        matches.push(unescapePdfLiteral(literal[0].slice(1, -1)));
      }
    }
  }

  return normalizeText(matches.filter(Boolean).join(" "));
}

function parseZipEntries(bytes: Uint8Array) {
  const entries: Array<{ name: string; compression: number; compressedSize: number; localHeaderOffset: number }> = [];
  const endOfCentralDir = findEndOfCentralDirectory(bytes);
  if (endOfCentralDir < 0) {
    return entries;
  }

  const entryCount = readUInt16(bytes, endOfCentralDir + 10);
  const centralDirectoryOffset = readUInt32(bytes, endOfCentralDir + 16);
  let cursor = centralDirectoryOffset;

  for (let i = 0; i < entryCount; i += 1) {
    if (readUInt32(bytes, cursor) !== 0x02014b50) {
      break;
    }

    const compression = readUInt16(bytes, cursor + 10);
    const compressedSize = readUInt32(bytes, cursor + 20);
    const nameLength = readUInt16(bytes, cursor + 28);
    const extraLength = readUInt16(bytes, cursor + 30);
    const commentLength = readUInt16(bytes, cursor + 32);
    const localHeaderOffset = readUInt32(bytes, cursor + 42);
    const name = new TextDecoder().decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));

    entries.push({ name, compression, compressedSize, localHeaderOffset });
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

async function readZipEntry(
  bytes: Uint8Array,
  entry: { compression: number; compressedSize: number; localHeaderOffset: number },
) {
  if (readUInt32(bytes, entry.localHeaderOffset) !== 0x04034b50) {
    throw new Error("Invalid ZIP local header");
  }

  const nameLength = readUInt16(bytes, entry.localHeaderOffset + 26);
  const extraLength = readUInt16(bytes, entry.localHeaderOffset + 28);
  const start = entry.localHeaderOffset + 30 + nameLength + extraLength;
  const compressedBytes = bytes.slice(start, start + entry.compressedSize);

  if (entry.compression === 0) {
    return compressedBytes;
  }

  if (entry.compression === 8) {
    const stream = new Blob([compressedBytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const arrayBuffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  throw new Error(`Unsupported ZIP compression method: ${entry.compression}`);
}

function extractXmlText(xml: string) {
  const output: string[] = [];
  for (const match of xml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)) {
    output.push(decodeXmlEntities(match[1]));
  }
  return normalizeText(output.join(" "));
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    return parsed;
  } catch {
    return null;
  }
}

function fallbackSummary(text: string) {
  const sentences = splitSentences(text).slice(0, 2);
  if (sentences.length) {
    return sentences.join(" ");
  }
  return text.slice(0, 220) || "Document indexed successfully.";
}

function fallbackInsights(text: string) {
  const bullets = splitBullets(text);
  if (bullets.length) {
    return bullets.slice(0, 4);
  }

  const sentences = splitSentences(text);
  return sentences.slice(0, 4).map((sentence) => sentence.slice(0, 120));
}

function fallbackRecommendations(text: string) {
  const recommendations = [
    "Review the key takeaways and assign an owner for follow-up.",
    "Link this document to the most relevant workspace collection.",
  ];

  if (text.length > 2_500) {
    recommendations.push("Use semantic search to surface the highest-similarity passages before sharing with the team.");
  }

  return recommendations;
}

function fallbackConfidence(text: string) {
  const lengthScore = Math.min(28, Math.round(text.length / 240));
  return clampConfidence(68 + lengthScore, 74);
}

function splitSentences(text: string) {
  return normalizeText(text)
    .split(/(?<=[.?!])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitBullets(text: string) {
  return normalizeText(text)
    .split("\n")
    .map((line) => line.replace(/^[-*•\d.]+\s*/, "").trim())
    .filter((line) => line.length > 15 && line.length < 160);
}

function buildChunks(text: string, kind: KnowledgeDocumentKind) {
  if (kind === "text" && text.includes("\n") && text.split("\n").length > 8) {
    return buildParagraphChunks(text);
  }

  return buildParagraphChunks(text);
}

function buildParagraphChunks(text: string) {
  const paragraphs = normalizeText(text)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (!current) {
      current = paragraph;
      continue;
    }

    if (current.length + paragraph.length + 2 > MAX_CHUNK_LENGTH) {
      chunks.push(current);
      current = paragraph;
      continue;
    }

    current = `${current}\n\n${paragraph}`;
  }

  if (current) {
    chunks.push(current);
  }

  if (!chunks.length) {
    chunks.push(normalizeText(text).slice(0, MAX_CHUNK_LENGTH));
  }

  return chunks.slice(0, 16);
}

function inferDocumentKind(extension: string | null, mimeType: string | null): KnowledgeDocumentKind {
  if (extension === "pdf" || mimeType === "application/pdf") return "pdf";
  return "text";
}

function inferSourceLabel(sourceType: KnowledgeDocumentSourceType, fileName: string | null, title: string) {
  if (sourceType === "note") return "Notes";
  if (sourceType === "paste") return "Pasted Text";
  if (fileName) return fileName.replace(/\.[^.]+$/, "");
  return title;
}

function inferExtension(fileName: string | null) {
  if (!fileName || !fileName.includes(".")) return null;
  return fileName.split(".").pop()?.toLowerCase() ?? null;
}

function normalizeCollectionName(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\s+/g, " ") : "";
}

function normalizeTags(tags: string[]) {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function pickCollectionColor(name: string) {
  const palette = ["slate", "sky", "emerald", "violet", "amber", "rose", "indigo"];
  const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, codePoint) => String.fromCharCode(Number(codePoint)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, codePoint) => String.fromCharCode(Number.parseInt(codePoint, 16)));
}

function unescapePdfLiteral(value: string) {
  let output = "";
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char !== "\\") {
      output += char;
      continue;
    }

    const next = value[i + 1];
    if (!next) break;

    if (next === "n") {
      output += "\n";
      i += 1;
      continue;
    }
    if (next === "r") {
      output += "\r";
      i += 1;
      continue;
    }
    if (next === "t") {
      output += "\t";
      i += 1;
      continue;
    }
    if (next === "b") {
      output += "\b";
      i += 1;
      continue;
    }
    if (next === "f") {
      output += "\f";
      i += 1;
      continue;
    }
    if (next === "(" || next === ")" || next === "\\") {
      output += next;
      i += 1;
      continue;
    }
    if (/[0-7]/.test(next)) {
      const octal = value.slice(i + 1, i + 4).match(/^[0-7]{1,3}/)?.[0] ?? next;
      output += String.fromCharCode(Number.parseInt(octal, 8));
      i += octal.length;
      continue;
    }

    output += next;
    i += 1;
  }

  return output;
}

function hexToPdfText(hex: string) {
  const clean = hex.replace(/\s+/g, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

function findEndOfCentralDirectory(bytes: Uint8Array) {
  for (let i = bytes.length - 22; i >= 0; i -= 1) {
    if (readUInt32(bytes, i) === 0x06054b50) {
      return i;
    }
  }
  return -1;
}

function readUInt16(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUInt32(bytes: Uint8Array, offset: number) {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

function coerceText(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
}

function coerceList(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean).slice(0, 5);
  }
  if (typeof value === "string" && value.trim()) {
    return splitSentences(value).slice(0, 5);
  }
  return fallback;
}

function clampConfidence(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return Math.max(0, Math.min(100, Math.round(parsed)));
  }
  return fallback;
}
