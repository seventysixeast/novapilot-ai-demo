"use client";

import { useState } from "react";
import { FileText, Plus, Search, Star, Clock, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Note = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  starred: boolean;
  updatedAt: string;
};

const DEMO_NOTES: Note[] = [
  {
    id: "1",
    title: "Q2 Growth Strategy",
    body: "Key focus areas: reduce CAC by improving onboarding funnel. Target 80% activation rate by end of Q2. Prioritize enterprise tier expansion...",
    tags: ["strategy", "growth"],
    starred: true,
    updatedAt: "2 hours ago",
  },
  {
    id: "2",
    title: "Churn Reduction Plan",
    body: "Identified 3 high-risk accounts via AI anomaly detection. Action items: proactive outreach within 48 hours, offer feature walkthrough sessions...",
    tags: ["retention", "action"],
    starred: false,
    updatedAt: "Yesterday",
  },
  {
    id: "3",
    title: "Investor Metrics Brief",
    body: "Current MRR: $54,200. Growth rate: 12% WoW. Key narrative: AI-driven efficiency gains. NovaPilot positioning as category leader...",
    tags: ["investor", "metrics"],
    starred: true,
    updatedAt: "2 days ago",
  },
];

function getStoredNotes() {
  if (typeof window === "undefined") {
    return DEMO_NOTES;
  }

  try {
    const stored = window.localStorage.getItem("novapilot-notes");
    if (!stored) return DEMO_NOTES;

    const parsed = JSON.parse(stored) as Note[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEMO_NOTES;
  } catch {
    return DEMO_NOTES;
  }
}

function persistNotes(notes: Note[]) {
  try {
    window.localStorage.setItem("novapilot-notes", JSON.stringify(notes));
  } catch {
    // Ignore storage issues in restricted browsers.
  }
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(() => getStoredNotes());
  const [query, setQuery] = useState("");
  const [activeNote, setActiveNote] = useState<Note | null>(() => getStoredNotes()[0] ?? null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.body.toLowerCase().includes(query.toLowerCase())
  );

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      title: newTitle,
      body: newBody,
      tags: [],
      starred: false,
      updatedAt: "Just now",
    };
    setNotes((prev) => {
      const next = [note, ...prev];
      persistNotes(next);
      return next;
    });
    setNewTitle("");
    setNewBody("");
    setIsCreating(false);
    setActiveNote(note);
  };

  const toggleStar = (id: string) => {
    setNotes((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, starred: !n.starred } : n));
      persistNotes(next);
      return next;
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              Team Workspace
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Team Notes</h1>
          <p className="text-slate-500">Collaborative intelligence notes, strategies, and briefings.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="h-11 px-5 rounded-2xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 hover:bg-sky-500 transition-all shadow-lg shadow-slate-200"
        >
          <Plus className="h-4 w-4" /> New Note
        </button>
      </header>

      {/* Create Note Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">New Note</h2>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-900 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full text-xl font-bold text-slate-900 placeholder:text-slate-300 outline-none border-b border-slate-100 pb-3"
                autoFocus
              />
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Start writing..."
                rows={5}
                className="w-full text-sm text-slate-700 placeholder:text-slate-300 outline-none resize-none"
              />
            </div>
            <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setIsCreating(false)}
                className="h-10 px-5 rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="h-10 px-5 rounded-2xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-sky-500 transition-all disabled:opacity-40"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Notes List */}
        <div className="lg:col-span-1 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-300 transition-all"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <FileText className="h-8 w-8 mx-auto mb-3 text-slate-200" />
                <p className="text-sm font-bold">No notes found</p>
              </div>
            )}
            {filtered.map((note) => (
              <article
                key={note.id}
                onClick={() => setActiveNote(note)}
                className={cn(
                  "card p-4 cursor-pointer transition-all hover:border-sky-200 hover:-translate-y-0.5",
                  activeNote?.id === note.id && "border-sky-300 bg-sky-50/30"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{note.title}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(note.id); }}
                    className={cn("shrink-0 transition-colors", note.starred ? "text-amber-400" : "text-slate-200 hover:text-amber-400")}
                  >
                    <Star className="h-3.5 w-3.5" fill={note.starred ? "currentColor" : "none"} />
                  </button>
                </div>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{note.body || "No body text yet."}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {note.tags.map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500">
                      {tag}
                    </span>
                  ))}
                  <span className="flex items-center gap-1 text-[9px] text-slate-400 ml-auto">
                    <Clock className="h-2.5 w-2.5" /> {note.updatedAt}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Note Content */}
        <div className="lg:col-span-2">
          {activeNote ? (
            <article className="card p-8 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  {activeNote.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      <Tag className="h-2.5 w-2.5" /> {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => toggleStar(activeNote.id)}
                  className={cn("transition-colors", activeNote.starred ? "text-amber-400" : "text-slate-300 hover:text-amber-400")}
                >
                  <Star className="h-5 w-5" fill={activeNote.starred ? "currentColor" : "none"} />
                </button>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{activeNote.title}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Updated {activeNote.updatedAt}
              </p>
              <div className="mt-6 text-slate-700 leading-relaxed">{activeNote.body}</div>
            </article>
          ) : (
            <div className="card p-8 h-full flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-6">
                <FileText className="h-7 w-7 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Select a note</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-xs">Click any note from the list to view its full content here, or create a new note to start a workspace thread.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
