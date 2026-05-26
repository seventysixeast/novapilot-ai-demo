-- NovaPilot AI: RAG & Knowledge Base Infrastructure

-- 1. Knowledge Chunks Table
create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  source_type text not null, -- 'document', 'connection', 'manual'
  source_id text, -- ID in source system
  content text not null,
  metadata jsonb default '{}',
  embedding vector(1536),
  created_at timestamptz not null default now()
);

alter table public.knowledge_chunks enable row level security;

create policy "knowledge_chunks_member_access" on public.knowledge_chunks
for select to authenticated
using (public.is_org_member(organization_id));

-- 2. Search Function for Knowledge
create or replace function public.match_knowledge(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  target_org_id uuid
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql
stable
as $$
  select
    id,
    content,
    metadata,
    1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
  from knowledge_chunks
  where 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
    and organization_id = target_org_id
  order by knowledge_chunks.embedding <=> query_embedding
  limit match_count;
$$;
