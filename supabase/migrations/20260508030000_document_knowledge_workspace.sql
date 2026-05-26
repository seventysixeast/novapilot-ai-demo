-- Documents / Knowledge Base workspace
-- Adds first-class document registry and collection support on top of the RAG layer.

create table if not exists public.knowledge_collections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  color text not null default 'slate',
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  collection_id uuid references public.knowledge_collections (id) on delete set null,
  title text not null,
  source_type text not null default 'upload',
  source_label text not null default 'Upload',
  kind public.document_kind not null default 'text',
  file_name text,
  file_extension text,
  mime_type text,
  file_size_bytes bigint,
  source_uri text,
  status public.document_status not null default 'uploaded',
  ingestion_stage text not null default 'queued',
  embedding_status text not null default 'pending',
  index_status text not null default 'pending',
  progress integer not null default 0,
  chunk_count integer not null default 0,
  summary text,
  key_insights jsonb not null default '[]',
  recommendations jsonb not null default '[]',
  confidence_score integer not null default 0,
  tags text[] not null default '{}',
  content_excerpt text,
  last_error text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_collections_org_created_idx
  on public.knowledge_collections (organization_id, created_at desc);

create index if not exists knowledge_documents_org_created_idx
  on public.knowledge_documents (organization_id, created_at desc);

create index if not exists knowledge_documents_org_status_idx
  on public.knowledge_documents (organization_id, status, ingestion_stage);

create index if not exists knowledge_documents_org_collection_idx
  on public.knowledge_documents (organization_id, collection_id);

alter table public.knowledge_collections enable row level security;
alter table public.knowledge_documents enable row level security;

create policy "knowledge_collections_member_access" on public.knowledge_collections
for select to authenticated
using (public.is_org_member(organization_id));

create policy "knowledge_documents_member_access" on public.knowledge_documents
for select to authenticated
using (public.is_org_member(organization_id));

