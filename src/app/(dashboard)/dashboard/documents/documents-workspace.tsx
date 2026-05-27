"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  CircleCheckBig,
  FileText,
  FileType2,
  FolderKanban,
  Layers3,
  Loader2,
  MessageSquareText,
  NotebookPen,
  Plus,
  Search,
  Sparkles,
  Upload,
  WandSparkles,
  Waves,
} from "lucide-react";

import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  KnowledgeCollectionRecord,
  KnowledgeDocUploadState,
  KnowledgeDocumentRecord,
  KnowledgeQueryLogRecord,
  KnowledgeSemanticSearchState,
} from "@/lib/documents/types";
import { ingestDocumentAction, runSemanticSearchAction } from "./actions";

type DocumentsWorkspaceProps = {
  documents: Array<KnowledgeDocumentRecord & { collectionName: string | null; collectionColor: string | null }>;
  collections: Array<KnowledgeCollectionRecord & { documentCount: number }>;
  sourceSummaries: Array<{
    key: string;
    label: string;
    count: number;
    readyCount: number;
    processingCount: number;
    failedCount: number;
    latestAt: string | null;
    color: string;
  }>;
  recentQueries: KnowledgeQueryLogRecord[];
  stats: {
    totalDocuments: number;
    readyDocuments: number;
    processingDocuments: number;
    failedDocuments: number;
    totalChunks: number;
    averageConfidence: number;
    collectionCount: number;
    sourceCount: number;
  };
  routerConfig: {
    defaultLightweightProvider: string;
    defaultPremiumProvider: string;
    fallbackEnabled: boolean;
    preferredModels: Record<string, string>;
  };
};

type ViewMode = "grid" | "list";
type IngestMode = "upload" | "paste" | "note";

const QUICK_PROMPTS = [
  "What decisions does this workspace already support?",
  "Summarize the most recent document collection.",
  "Which sources are the most reliable?",
  "Show the strongest source references for onboarding.",
];

const MODE_TABS: Array<{ value: IngestMode; label: string; icon: typeof Upload }> = [
  { value: "upload", label: "Upload", icon: Upload },
  { value: "paste", label: "Paste Text", icon: FileText },
  { value: "note", label: "Note", icon: NotebookPen },
];

const FILE_HINTS = [
  { name: "PDF", color: "rose" },
  { name: "DOCX", color: "sky" },
  { name: "TXT", color: "slate" },
  { name: "MD", color: "violet" },
  { name: "CSV", color: "emerald" },
];

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

const TEMPLATES: Record<string, string> = {
  "Executive summary": `# Executive Summary: [Topic Name]

## 📌 Objective
Brief description of the goals and purpose of this document.

## 🔑 Key Takeaways
- Takeaway 1: [Core insight/decision]
- Takeaway 2: [Core insight/decision]
- Takeaway 3: [Core insight/decision]

## 📊 Metrics & Impact
Key metrics, timelines, and expected results.`,

  "Customer feedback": `# Customer Feedback: [Customer/Company Name]

## 🗣️ User Profile
- Role: [e.g., Product Manager, VP of Sales]
- Account Tier: [e.g., Enterprise, Pro]
- Industry: [e.g., FinTech, SaaS]

## 🎯 Pain Points & Requests
1. [Pain Point 1]: Description, frequency, and severity.
2. [Pain Point 2]: Description, frequency, and severity.

## 💡 Proposed Solutions / Action Items
- [ ] Action item 1
- [ ] Action item 2`,

  "Meeting notes": `# Meeting Notes: [Project/Team Name]

## 📅 Details
- Date: [Date]
- Attendees: [Name 1], [Name 2]

## 💬 Agenda & Discussion
- [Topic A]: Key notes, arguments, and decisions.
- [Topic B]: Key notes, arguments, and decisions.

## 🚀 Next Steps & Action Items
- [ ] @[Name] to do [Task] by [Date]
- [ ] @[Name] to do [Task] by [Date]`,

  "Runbook": `# Runbook: [Process Name]

## 📝 Overview
Step-by-step operational guide for [Process].

## 🛠️ Prerequisites
- Dependency 1
- Dependency 2

## 🚀 Steps to Execute
1. **Step 1**: Detailed explanation.
2. **Step 2**: Detailed explanation.
3. **Step 3**: Detailed explanation.

## 🚨 Troubleshooting & Escalation
Contact @[Name] in case of issues.`,

  "FAQ": `# Frequently Asked Questions: [Topic Name]

### Q1: [Question 1]?
**A1**: [Answer 1]

### Q2: [Question 2]?
**A2**: [Answer 2]

### Q3: [Question 3]?
**A3**: [Answer 3]`
};

export function DocumentsWorkspace({
  documents,
  collections,
  sourceSummaries,
  recentQueries,
  stats,
  routerConfig,
}: DocumentsWorkspaceProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [ingestMode, setIngestMode] = useState<IngestMode>("upload");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(documents[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadState, uploadAction] = useActionState(ingestDocumentAction, INITIAL_UPLOAD_STATE);
  const [searchState, searchAction, searchPending] = useActionState(runSemanticSearchAction, INITIAL_SEARCH_STATE);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const wordCount = noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0;
  const charCount = noteContent.length;

  const activeDocumentId = selectedDocumentId;

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      if (!searchQuery.trim()) return true;
      const needle = searchQuery.toLowerCase();
      return (
        document.title.toLowerCase().includes(needle) ||
        document.summary?.toLowerCase().includes(needle) ||
        document.source_label.toLowerCase().includes(needle) ||
        document.tags?.some((tag) => tag.toLowerCase().includes(needle)) ||
        document.collectionName?.toLowerCase().includes(needle)
      );
    });
  }, [documents, searchQuery]);

  const selectedDocument = filteredDocuments.find((document) => document.id === activeDocumentId) ?? filteredDocuments[0] ?? null;
  const activeCollections = collections.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-24">
      <header className="relative overflow-hidden rounded-[3rem] bg-slate-950 px-8 py-10 text-white shadow-2xl shadow-slate-900/20 md:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.18),transparent_28%)]" />
        <div className="absolute -right-12 top-6 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-sky-300">
                <Layers3 className="h-3 w-3" />
                Knowledge workspace
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                Fast answers
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Documents</h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                Upload files or notes, then search them later in plain English with source-backed answers.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIngestMode("upload");
                  const element = document.getElementById("ingest");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-[10px] font-black uppercase tracking-widest text-slate-950 shadow-2xl shadow-slate-950/20 transition-all hover:scale-[1.01] hover:bg-sky-50 cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                Upload document
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById("search");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                  setTimeout(() => {
                    const searchInput = document.querySelector<HTMLInputElement>("input[name='query']");
                    if (searchInput) {
                      searchInput.focus();
                    }
                  }, 400);
                }}
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:border-sky-300 hover:bg-white/10 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                Ask questions
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <StatPanel label="Documents" value={stats.totalDocuments} detail={`${stats.readyDocuments} ready`} />
            <StatPanel label="Sections" value={stats.totalChunks} detail={`${stats.processingDocuments} processing`} />
            <StatPanel label="Average confidence" value={`${stats.averageConfidence}%`} detail={routerConfig.fallbackEnabled ? "Backup on" : "Single route"} />
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Collections" value={stats.collectionCount} icon={FolderKanban} accent="sky" detail="Grouped knowledge spaces" />
        <KpiCard label="Ready" value={stats.readyDocuments} icon={CircleCheckBig} accent="emerald" detail="Indexed and searchable" />
        <KpiCard label="Processing" value={stats.processingDocuments} icon={Loader2} accent="amber" detail="Preparing and indexing" />
        <KpiCard label="Sources" value={stats.sourceCount} icon={Waves} accent="violet" detail="Uploads, notes, and pasted text" />
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <section id="ingest" className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Add content</h2>
                <p className="mt-0.5 text-xs text-slate-500">Upload files, paste text, or save notes — they become searchable instantly.</p>
              </div>
              <div className="hidden items-center gap-1.5 md:flex">
                {FILE_HINTS.map((hint) => (
                  <span
                    key={hint.name}
                    className={cn(
                      "rounded-lg border px-2 py-1 text-[9px] font-semibold uppercase tracking-wider",
                      hint.color === "rose" && "border-rose-100 bg-rose-50 text-rose-600",
                      hint.color === "sky" && "border-sky-100 bg-sky-50 text-sky-600",
                      hint.color === "slate" && "border-slate-100 bg-slate-50 text-slate-500",
                      hint.color === "violet" && "border-violet-100 bg-violet-50 text-violet-600",
                      hint.color === "emerald" && "border-emerald-100 bg-emerald-50 text-emerald-600",
                    )}
                  >
                    {hint.name}
                  </span>
                ))}
              </div>
            </div>

            <form action={uploadAction} className="space-y-6 p-6">
              <input type="hidden" name="mode" value={ingestMode} />
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="flex gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-1.5">
                    {MODE_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const active = ingestMode === tab.value;
                      return (
                        <button
                          key={tab.value}
                          type="button"
                          onClick={() => setIngestMode(tab.value)}
                          className={cn(
                            "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                            active ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-4">
                    <TextField
                      label="Document title"
                      name="title"
                      placeholder="Q2 Product Spec, Research Memo, Customer Notes..."
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField
                        label="Collection"
                        name="collection_name"
                        placeholder="Product, Sales, Research, Support"
                        helper="Creates a collection automatically if it does not exist."
                      />
                      <TextField
                        label="Tags"
                        name="tags"
                        placeholder="onboarding, pricing, retention"
                        helper="Comma-separated tags for filtering."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <TextField
                    label="Source label"
                    name="source_label"
                    placeholder="Optional human-friendly label"
                    helper="Useful for grouping uploaded files and notes."
                  />
                  <TextField
                    label="Source URL"
                    name="source_uri"
                    placeholder="https://..."
                    helper="Optional source reference or origin link."
                  />
                </div>
              </div>

              {ingestMode === "upload" ? (
                <div className="space-y-4">
                  <div className={cn(selectedFile ? "block" : "hidden")}>
                    <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/40 to-white p-6 shadow-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-600 shadow-sm">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{selectedFile?.name}</p>
                            <p className="text-xs text-slate-400">{selectedFile ? (selectedFile.size / 1024).toFixed(1) : 0} KB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            const fileInput = document.querySelector<HTMLInputElement>("input[name='file']");
                            if (fileInput) fileInput.value = "";
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 transition-all hover:bg-rose-50 hover:border-rose-200 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <label className={cn("group cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/40 p-8 text-center transition-all duration-200 hover:border-sky-400 hover:bg-sky-50/40", selectedFile ? "hidden" : "block")}>
                    <input
                      type="file"
                      name="file"
                      className="hidden"
                      accept=".pdf,.docx,.txt,.md,.markdown,.csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedFile(file);
                        if (file && !docTitle) {
                          const baseName = file.name.replace(/\.[^.]+$/, "");
                          setDocTitle(baseName);
                        }
                      }}
                    />
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-sky-500 shadow-sm ring-1 ring-slate-100 transition-transform group-hover:scale-110">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Drop files here or click to browse</p>
                    <p className="mt-1.5 text-xs text-slate-500">PDF, DOCX, TXT, Markdown, and CSV — parsed and indexed automatically</p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {["Upload", "Parse", "Chunk", "Embed", "Index"].map((step, i) => (
                        <span key={step} className="flex items-center gap-1.5">
                          <span className="rounded-lg border border-slate-100 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 shadow-sm">{step}</span>
                          {i < 4 && <span className="text-slate-300 text-xs">›</span>}
                        </span>
                      ))}
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <textarea
                      name="content"
                      rows={8}
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder={
                        ingestMode === "note"
                          ? "Write a note, meeting summary, decision log, or operating memo..."
                          : "Paste plain text, notes, a research excerpt, CSV rows, or any workspace content..."
                      }
                      className="w-full rounded-[2rem] border border-slate-200 bg-white px-5 py-4 text-sm leading-6 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-50"
                    />
                    <div className="absolute bottom-4 right-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {charCount} chars · {wordCount} words
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Executive summary", "Customer feedback", "Meeting notes", "Runbook", "FAQ"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (noteContent.trim() && !confirm("Do you want to replace your current note with this template?")) {
                            return;
                          }
                          const template = TEMPLATES[tag] || (tag + "\n\n");
                          setNoteContent(template);
                        }}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-5 rounded-3xl border border-slate-100 bg-slate-50/60 p-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Upload progress</p>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      { label: "Uploaded", value: stats.totalDocuments, color: "sky" },
                      { label: "Ready", value: stats.readyDocuments, color: "emerald" },
                      { label: "Processing", value: stats.processingDocuments, color: "amber" },
                      { label: "Failed", value: stats.failedDocuments, color: "rose" },
                    ].map((stage) => (
                      <div key={stage.label} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[9px] font-semibold uppercase tracking-wider text-slate-500">{stage.label}</span>
                          <span
                            className={cn(
                              "text-sm font-bold",
                              stage.color === "sky" && "text-sky-600",
                              stage.color === "emerald" && "text-emerald-600",
                              stage.color === "amber" && "text-amber-600",
                              stage.color === "rose" && "text-rose-600",
                            )}
                          >
                            {stage.value}
                          </span>
                        </div>
                        <div className="mt-3 h-1 rounded-full bg-slate-100">
                          <div
                            className={cn(
                              "h-1 rounded-full",
                              stage.color === "sky" && "bg-sky-500",
                              stage.color === "emerald" && "bg-emerald-500",
                              stage.color === "amber" && "bg-amber-500",
                              stage.color === "rose" && "bg-rose-500",
                            )}
                            style={{ width: `${Math.min(100, Math.max(12, stage.value * 12))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 pt-2 xl:pt-0">
                  <FormSubmitButton
                    idleText="Index Knowledge"
                    pendingText="Indexing..."
                    icon={<Plus className="h-4 w-4" />}
                    className="h-12 w-full px-6 xl:w-auto"
                  />
                </div>
              </div>

              {uploadState.status !== "idle" && uploadState.message ? (
                <div
                  className={cn(
                    "rounded-2xl border p-4 text-sm",
                    uploadState.status === "success"
                      ? "border-emerald-100 bg-emerald-50/60 text-emerald-900"
                      : uploadState.status === "error"
                      ? "border-rose-100 bg-rose-50/60 text-rose-900"
                      : "border-sky-100 bg-sky-50/60 text-sky-900",
                  )}
                >
                  <p className="font-bold">{uploadState.message}</p>
                  {uploadState.summary ? <p className="mt-2 text-sm leading-6 opacity-90">{uploadState.summary}</p> : null}
                  {uploadState.status === "success" && uploadState.documentId ? (
                    <button
                      type="button"
                      onClick={() => setSelectedDocumentId(uploadState.documentId ?? null)}
                      className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-900 transition-all hover:scale-[1.01]"
                    >
                      Open document
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  {uploadState.warnings?.length ? (
                    <ul className="mt-2 space-y-1 text-xs opacity-80">
                      {uploadState.warnings.map((warning) => (
                        <li key={warning}>- {warning}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </form>
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Knowledge Library</h2>
                <p className="mt-0.5 text-xs text-slate-500">Searchable document cards, collections, sources, and AI summaries.</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-all",
                    viewMode === "grid" ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-700",
                  )}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-all",
                    viewMode === "list" ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-700",
                  )}
                >
                  List
                </button>
              </div>
            </div>

            <div className="border-b border-slate-100 px-6 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[240px] flex-1">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Filter by title, tag, source, or collection..."
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500">All {documents.length}</span>
                  <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700">Ready {stats.readyDocuments}</span>
                  <span className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold text-amber-700">Processing {stats.processingDocuments}</span>
                </div>
              </div>
            </div>

            {filteredDocuments.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid gap-4 p-6 md:grid-cols-2">
                  {filteredDocuments.map((document) => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      active={activeDocumentId === document.id}
                      onSelect={() => setSelectedDocumentId(document.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {filteredDocuments.map((document) => (
                    <DocumentListRow
                      key={document.id}
                      document={document}
                      active={activeDocumentId === document.id}
                      onSelect={() => setSelectedDocumentId(document.id)}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="p-10">
                <EmptyDocumentsState />
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section className="card overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Document details</h2>
              <p className="text-sm text-slate-500">Selected document, summary, and source details.</p>
            </div>

            {selectedDocument ? (
              <div className="space-y-5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Currently selected</p>
                    <h3 className="mt-2 truncate text-xl font-bold text-slate-900">{selectedDocument.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedDocument.source_label} - {selectedDocument.collectionName ?? "Unassigned collection"}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest", getStatusTone(selectedDocument.status).badge)}>
                    {selectedDocument.status}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <MiniInfo label="Sections" value={selectedDocument.chunk_count} />
                  <MiniInfo label="Confidence" value={`${selectedDocument.confidence_score}%`} />
                  <MiniInfo label="Stage" value={selectedDocument.ingestion_stage} />
                  <MiniInfo label="Updated" value={new Date(selectedDocument.updated_at).toLocaleString()} />
                </div>

                <div className="rounded-[1.6rem] border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Summary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {selectedDocument.summary ?? selectedDocument.content_excerpt ?? "This document is ready to search."}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Key points</p>
                  <div className="space-y-2">
                    {(selectedDocument.key_insights ?? []).length > 0 ? (
                      selectedDocument.key_insights?.map((insight) => (
                        <div key={insight} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                          {insight}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        No clear points yet. Ask a question or upload a better source to generate them.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Next steps</p>
                  <div className="space-y-2">
                    {(selectedDocument.recommendations ?? []).length > 0 ? (
                      selectedDocument.recommendations?.map((recommendation) => (
                        <div key={recommendation} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                          {recommendation}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        Next steps will appear after NovaPilot finishes analyzing the document.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(selectedDocument.tags ?? []).length > 0 ? (
                    selectedDocument.tags?.map((tag) => (
                      <Badge key={tag} className="rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-600">No tags</Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6">
                <EmptyDocumentsState />
              </div>
            )}
          </section>

          <section id="search" className="card overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Ask a question</h2>
                  <p className="text-sm text-slate-500">Get an answer with source citations.</p>
                </div>
                <Badge className="rounded-full border border-sky-100 bg-sky-50 text-sky-700">
                  {routerConfig.defaultPremiumProvider} backup
                </Badge>
              </div>
            </div>

            <form action={searchAction} className="space-y-4 p-6">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="query"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Ask the workspace: 'What changed in the latest plan?'"
                  className="w-full rounded-[1.4rem] border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-50"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setSearchQuery(prompt)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-slate-100 bg-slate-50/70 p-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Provider routing</p>
                  <p className="text-xs font-bold text-slate-900">
                    Fast: {routerConfig.defaultLightweightProvider} | Deep: {routerConfig.defaultPremiumProvider}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Backup {routerConfig.fallbackEnabled ? "on" : "off"} | {Object.keys(routerConfig.preferredModels).length} model targets
                  </p>
                </div>
                <SearchSubmitButton pending={searchPending} />
              </div>
            </form>

            {searchState.status !== "idle" ? (
              <div className="space-y-4 border-t border-slate-100 px-6 pb-6">
                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Answer</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{searchState.query || searchQuery || "Latest query"}</p>
                  </div>
                  <ConfidenceBadge confidence={searchState.confidence} />
                </div>

                <div className="rounded-[1.6rem] border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm ring-1 ring-slate-100">
                      <WandSparkles className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">
                        {searchState.answer || searchState.message || "Ask a question to get a source-backed answer."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sources</p>
                  <div className="space-y-2">
                    {searchState.citations.length > 0 ? (
                      searchState.citations.map((citation) => (
                        <div key={citation.documentId} className="rounded-2xl border border-slate-100 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">{citation.documentTitle}</p>
                              <p className="text-xs text-slate-500">
                                {citation.sourceLabel}
                                {citation.collectionName ? ` - ${citation.collectionName}` : ""}
                              </p>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                              {(citation.similarity * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-500">{citation.snippet}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                        Ask a question to see ranked source citations.
                      </div>
                    )}
                  </div>
                </div>

                {searchState.results.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Top Matches</p>
                    {searchState.results.map((result) => {
                      const metadata = (result.metadata ?? {}) as Record<string, string | number | undefined>;
                      const title = String(metadata.document_title ?? metadata.file_name ?? "Document");
                      const chunkIndex = Number(metadata.chunk_index ?? 1);
                      const chunkCount = Number(metadata.chunk_count ?? 1);
                      return (
                        <div key={result.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">{title}</p>
                              <p className="text-xs text-slate-500">
                              Section {chunkIndex} of {chunkCount}
                              </p>
                            </div>
                            <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
                              {(result.similarity * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-500">{result.content.slice(0, 180)}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="border-t border-slate-100 px-6 pb-6 pt-4">
                <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-slate-300 shadow-sm ring-1 ring-slate-100">
                    <MessageSquareText className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Answers with sources</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Upload or paste content first. NovaPilot will rank the best matches and show citations.
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Collections & sources</h2>
              <p className="text-sm text-slate-500">Group related documents and track where they came from.</p>
            </div>

            <div className="space-y-6 p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Collections</p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{collections.length} total</span>
                </div>
                <div className="space-y-2">
                  {activeCollections.length > 0 ? (
                    activeCollections.map((collection) => (
                      <div key={collection.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">{collection.name}</p>
                            <p className="text-xs text-slate-500">{collection.description ?? "Ready for indexed documents"}</p>
                          </div>
                          <Badge className="rounded-full border border-slate-100 bg-slate-50 text-slate-600">{collection.documentCount}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                      Create a collection while uploading to group related documents.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sources</p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{sourceSummaries.length} lanes</span>
                </div>
                <div className="space-y-3">
                  {sourceSummaries.length > 0 ? (
                    sourceSummaries.map((source) => (
                      <div key={source.key} className="rounded-2xl border border-slate-100 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">{source.label}</p>
                            <p className="text-xs text-slate-500">
                              {source.count} documents - {source.readyCount} ready - {source.processingCount} processing
                            </p>
                          </div>
                          <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest", source.color)}>
                          {source.failedCount > 0 ? "Needs review" : "Healthy"}
                          </span>
                        </div>
                        <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                          <div
                            className={cn(
                              "h-1.5 rounded-full",
                              source.failedCount > 0 ? "bg-rose-500" : source.processingCount > 0 ? "bg-amber-500" : "bg-emerald-500",
                            )}
                            style={{ width: `${Math.max(12, Math.min(100, source.count * 18))}%` }}
                          />
                        </div>
                        <p className="mt-2 text-[11px] text-slate-400">
                          {source.latestAt ? `Last ingested ${source.latestAt}` : "No ingestion timestamp yet"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                      Source groups will appear here as files, notes, and pasted text are added.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <details className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-xl">
            <summary className="cursor-pointer list-none px-5 py-4 [&::-webkit-details-marker]:hidden">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                    <Layers3 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Diagnostic Console</p>
                    <p className="text-[10px] text-slate-500">AI router · index health · query log</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500 transition-transform duration-200 group-open:rotate-180" />
              </div>
            </summary>
            <div className="border-t border-slate-800 p-5 space-y-5">
              <div className="grid gap-2 md:grid-cols-3">
                {[
                  { label: "Fallback", value: routerConfig.fallbackEnabled ? "Enabled" : "Disabled" },
                  { label: "Light Route", value: routerConfig.defaultLightweightProvider },
                  { label: "Premium Route", value: routerConfig.defaultPremiumProvider },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">{s.label}</p>
                    <p className="mt-1 font-mono text-sm font-medium text-emerald-400">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Index Health</p>
                  <div className="mt-3 space-y-2">
                    {[
                      { label: "Ready", value: stats.readyDocuments, color: "text-emerald-400" },
                      { label: "Processing", value: stats.processingDocuments, color: "text-amber-400" },
                      { label: "Failed", value: stats.failedDocuments, color: "text-rose-400" },
                      { label: "Avg confidence", value: `${stats.averageConfidence}%`, color: "text-sky-400" },
                    ].map((m) => (
                      <div key={m.label} className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{m.label}</span>
                        <span className={cn("font-mono text-sm font-semibold", m.color)}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Recent Queries</p>
                  <div className="mt-3 space-y-2">
                    {recentQueries.length > 0 ? recentQueries.slice(0, 4).map((q) => (
                      <div key={q.id} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                        <p className="truncate text-xs text-slate-300">{q.query_text}</p>
                        <p className="mt-0.5 text-[10px] text-slate-600">{q.confidence_score ?? 0}% · {q.freshness_status ?? "unknown"}</p>
                      </div>
                    )) : (
                      <p className="text-xs text-slate-600 italic">No queries logged yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function StatPanel({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{detail}</p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof FolderKanban;
  accent: "sky" | "emerald" | "amber" | "violet";
}) {
  const accentStyles = {
    sky: { bar: "bg-sky-500", icon: "border-sky-100 bg-sky-50 text-sky-600", glow: "group-hover:shadow-sky-100/60" },
    emerald: { bar: "bg-emerald-500", icon: "border-emerald-100 bg-emerald-50 text-emerald-600", glow: "group-hover:shadow-emerald-100/60" },
    amber: { bar: "bg-amber-500", icon: "border-amber-100 bg-amber-50 text-amber-600", glow: "group-hover:shadow-amber-100/60" },
    violet: { bar: "bg-violet-500", icon: "border-violet-100 bg-violet-50 text-violet-600", glow: "group-hover:shadow-violet-100/60" },
  }[accent];
  return (
    <article className={cn("group card relative overflow-hidden p-5 transition-all hover:-translate-y-1", accentStyles.glow)}>
      <div className={cn("absolute left-0 top-0 h-full w-1 rounded-l-[1.25rem]", accentStyles.bar)} />
      <div className="flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", accentStyles.icon)}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

function DocumentCard({
  document,
  active,
  onSelect,
}: {
  document: DocumentsWorkspaceProps["documents"][number];
  active: boolean;
  onSelect: () => void;
}) {
  const statusTone = getStatusTone(document.status);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative w-full rounded-2xl border p-5 text-left transition-all duration-200",
        active
          ? "border-sky-200 bg-gradient-to-br from-sky-50/80 to-white shadow-lg shadow-sky-100/50 ring-1 ring-sky-200"
          : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md hover:shadow-slate-100/80 hover:-translate-y-0.5",
      )}
    >
      {active && <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-sky-400 to-sky-600" />}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm", statusTone.badge)}>
            <DocumentIcon document={document} />
          </div>
          <div className="min-w-0">
            <p className={cn("truncate text-sm font-semibold", active ? "text-sky-800" : "text-slate-900 group-hover:text-sky-700")}>{document.title}</p>
            <p className="mt-0.5 truncate text-xs text-slate-400">{document.source_label} · {new Date(document.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide", statusTone.badge)}>
          {document.status}
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-slate-400">
          <span>{document.ingestion_stage}</span>
          <span>{document.chunk_count} sections</span>
        </div>
        <div className="h-1 rounded-full bg-slate-100">
          <div
            className={cn("h-1 rounded-full transition-all", statusTone.bar, document.status === "processing" && "animate-pulse")}
            style={{ width: `${Math.min(100, Math.max(6, document.progress))}%` }}
          />
        </div>
      </div>

      {(document.summary ?? document.content_excerpt) && (
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{document.summary ?? document.content_excerpt}</p>
      )}

      {(document.tags ?? []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(document.tags ?? []).slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">{tag}</span>
          ))}
        </div>
      )}
    </button>
  );
}

function DocumentListRow({
  document,
  active,
  onSelect,
}: {
  document: DocumentsWorkspaceProps["documents"][number];
  active: boolean;
  onSelect: () => void;
}) {
  const statusTone = getStatusTone(document.status);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-4 px-6 py-3.5 text-left transition-all",
        active ? "bg-sky-50/50 border-l-2 border-sky-400" : "hover:bg-slate-50/60",
      )}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border", statusTone.badge)}>
        <DocumentIcon document={document} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("truncate text-sm font-medium", active ? "text-sky-800" : "text-slate-900")}>{document.title}</p>
          <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide", statusTone.badge)}>
            {document.status}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-400">
          {document.source_label} · {document.collectionName ?? "No collection"} · {document.chunk_count} sections
        </p>
      </div>
      <div className="hidden shrink-0 items-center gap-1.5 md:flex">
        {(document.tags ?? []).slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}

function EmptyDocumentsState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-white p-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-500 shadow-sm ring-1 ring-sky-100">
        <BookOpen className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-slate-900">Your knowledge base is empty</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Upload files, paste text, or add notes — then ask questions and get source-backed answers instantly.
      </p>
      <div className="mt-6 inline-flex items-center gap-4">
        <a href="#ingest" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-sky-600">
          <Upload className="h-3.5 w-3.5" /> Upload a document
        </a>
      </div>
      <div className="mt-6 grid gap-2 text-left md:grid-cols-3">
        {[["PDF / DOCX", "Parsed and indexed automatically"], ["Paste text", "Meetings, excerpts, and notes"], ["Markdown / CSV", "Structured content and data"]].map(([fmt, desc]) => (
          <div key={fmt} className="rounded-xl border border-slate-100 bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{fmt}</p>
            <p className="mt-1 text-xs text-slate-600">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const tone =
    confidence >= 85 ? "emerald" : confidence >= 65 ? "sky" : confidence >= 40 ? "amber" : "rose";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest",
        tone === "emerald" && "border-emerald-100 bg-emerald-50 text-emerald-700",
        tone === "sky" && "border-sky-100 bg-sky-50 text-sky-700",
        tone === "amber" && "border-amber-100 bg-amber-50 text-amber-700",
        tone === "rose" && "border-rose-100 bg-rose-50 text-rose-700",
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {confidence}% confidence
    </div>
  );
}

function SearchSubmitButton({ pending }: { pending: boolean }) {
  const { pending: formPending } = useFormStatus();
  const isPending = pending || formPending;

  return (
    <button
      type="submit"
      className="inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-slate-200 transition-all hover:bg-sky-500"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {isPending ? "Searching..." : "Search workspace"}
    </button>
  );
}

function TextField({
  label,
  name,
  placeholder,
  helper,
  value,
  onChange,
}: {
  label: string;
  name: string;
  placeholder: string;
  helper?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-50"
      />
      {helper ? <p className="text-[11px] text-slate-500">{helper}</p> : null}
    </label>
  );
}

function MiniInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ConsoleStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ConsoleMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}

function getStatusTone(status: string) {
  if (status === "ready") {
    return {
      badge: "border-emerald-100 bg-emerald-50 text-emerald-700",
      bar: "bg-emerald-500",
    };
  }

  if (status === "processing") {
    return {
      badge: "border-amber-100 bg-amber-50 text-amber-700",
      bar: "bg-amber-500",
    };
  }

  if (status === "failed") {
    return {
      badge: "border-rose-100 bg-rose-50 text-rose-700",
      bar: "bg-rose-500",
    };
  }

  return {
    badge: "border-slate-100 bg-slate-50 text-slate-600",
    bar: "bg-sky-500",
  };
}

function DocumentIcon({ document }: { document: DocumentsWorkspaceProps["documents"][number] }) {
  const fileName = (document.file_name ?? "").toLowerCase();
  const extension = document.file_extension?.toLowerCase() ?? fileName.split(".").pop() ?? "";

  if (extension === "pdf") return <FileText className="h-5 w-5" />;
  if (extension === "csv") return <FileType2 className="h-5 w-5" />;
  if (extension === "md" || extension === "markdown") return <NotebookPen className="h-5 w-5" />;
  if (extension === "docx") return <BookOpen className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
}
