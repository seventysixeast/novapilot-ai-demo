"use client";

import { useState } from "react";
import { Search, Sparkles, FileText, Globe, Database, ArrowUpRight, Clock, X } from "lucide-react";

import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  title: string;
  excerpt: string;
  source: "document" | "connector" | "query";
  confidence: number;
  timestamp: string;
};

const SEARCH_RESULTS: SearchResult[] = [
  {
    id: "1",
    title: "Revenue trend summary",
    excerpt: "Revenue grew 12.4% week over week, driven by plan upgrades. Customer acquisition cost stayed steady.",
    source: "query",
    confidence: 94,
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    title: "Billing update",
    excerpt: "A customer upgraded plans. Monthly revenue and customer value estimates were updated.",
    source: "connector",
    confidence: 88,
    timestamp: "5 hours ago",
  },
  {
    id: "3",
    title: "Activation report",
    excerpt: "Activation is up from last month, helped by better onboarding completion.",
    source: "document",
    confidence: 91,
    timestamp: "1 day ago",
  },
  {
    id: "4",
    title: "Retention risk",
    excerpt: "AI spotted a small group of accounts with lower login activity over the last two weeks.",
    source: "query",
    confidence: 79,
    timestamp: "2 days ago",
  },
];

const SOURCE_CONFIG = {
  query: { label: "AI Query", color: "bg-sky-50 text-sky-700 border-sky-100", icon: Sparkles },
  connector: { label: "Data Connector", color: "bg-violet-50 text-violet-700 border-violet-100", icon: Globe },
  document: { label: "Knowledge Base", color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: FileText },
};

export default function SemanticSearchPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const filtered = SEARCH_RESULTS.filter(
      (result) =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.excerpt.toLowerCase().includes(query.toLowerCase()),
    );

    setResults(filtered.length ? filtered : SEARCH_RESULTS);
    setIsSearching(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-20">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-600">Search ready</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Search your workspace</h1>
        <p className="max-w-xl leading-relaxed text-slate-500">
          Search documents, AI answers, and connected data in plain English.
        </p>
      </header>

      <form onSubmit={handleSearch}>
        <div className="group relative">
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-sky-500 to-emerald-500 opacity-0 blur transition duration-500 group-focus-within:opacity-10" />
          <div className="relative card p-2 shadow-xl shadow-sky-900/5">
            <div className="flex items-center gap-3 px-4">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents, answers, or data..."
                className="flex-1 bg-transparent py-4 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    setHasSearched(false);
                  }}
                  className="text-slate-400 transition-colors hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSearching ? <span className="animate-pulse">Searching...</span> : <>Search <Sparkles className="h-3 w-3" /></>}
              </button>
            </div>
          </div>
        </div>

        {!hasSearched && (
          <div className="mt-4 flex flex-wrap gap-2">
            {["MRR growth trends", "Churn risk signals", "Activation rate analysis", "CAC vs LTV"].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setQuery(prompt)}
                className="rounded-full border border-transparent bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-500 transition-all hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </form>

      {hasSearched && !isSearching && (
        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
          <Database className="h-3.5 w-3.5" />
          <span>
            {results.length} results for <span className="text-slate-700">{query}</span>
          </span>
        </div>
      )}

      {isSearching && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse p-6">
              <div className="mb-3 h-4 w-2/3 rounded bg-slate-100" />
              <div className="mb-2 h-3 w-full rounded bg-slate-50" />
              <div className="h-3 w-4/5 rounded bg-slate-50" />
            </div>
          ))}
        </div>
      )}

      {!isSearching && results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, i) => {
            const sourceConfig = SOURCE_CONFIG[result.source];
            const Icon = sourceConfig.icon;

            return (
              <article
                key={result.id}
                className="group card cursor-pointer p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={cn("flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest", sourceConfig.color)}>
                        <Icon className="h-2.5 w-2.5" />
                        {sourceConfig.label}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        <Clock className="h-2.5 w-2.5" /> {result.timestamp}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-sky-700">{result.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{result.excerpt}</p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Confidence</p>
                      <p
                        className={cn(
                          "text-xl font-black",
                          result.confidence >= 90 ? "text-emerald-600" : result.confidence >= 75 ? "text-sky-600" : "text-amber-600",
                        )}
                      >
                        {result.confidence}%
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-200 transition-colors group-hover:text-sky-500" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!hasSearched && (
        <div className="py-16 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100">
            <Search className="h-7 w-7 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Search everything in one place</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            Use plain language to find documents, answers, and connected data.
          </p>
        </div>
      )}
    </div>
  );
}
