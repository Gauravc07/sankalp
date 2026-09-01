-- Documents Vault hardening: a private, encrypted-at-rest storage bucket for
-- booking-scoped documents (allotment letters, agreements, receipts, NOCs),
-- with storage-level RLS mirroring the existing `documents` table policies so
-- a customer's files can only ever be reached by that customer or the
-- builder who owns the project — never by a shared link, another customer,
-- or another builder.
--
-- Path convention enforced by the policies below: every object lives at
-- `{project_id}/{booking_id}/{uuid}-{filename}`. The `documents` table gets a
-- `storage_path` column pointing at that object; the client never reads
-- `file_url` directly for vault documents — it always requests a fresh,
-- short-lived signed URL, so no permanent public link ever exists.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents-vault',
  'documents-vault',
  false,
  26214400,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

alter table public.documents add column storage_path text;

-- ---------------------------------------------------------------------------
-- Storage RLS — bucket is private, so without these policies no one
-- (including the uploader) can read an object back except via the Supabase
-- service role. Split into per-operation policies rather than `for all` so a
-- customer's read access can never be broadened into write/delete access.
-- ---------------------------------------------------------------------------
create policy "builder uploads own project vault objects"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents-vault'
    and public.is_builder_owner((storage.foldername(name))[1]::uuid)
  );

create policy "builder reads own project vault objects"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documents-vault'
    and public.is_builder_owner((storage.foldername(name))[1]::uuid)
  );

create policy "builder replaces own project vault objects"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'documents-vault'
    and public.is_builder_owner((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'documents-vault'
    and public.is_builder_owner((storage.foldername(name))[1]::uuid)
  );

create policy "builder deletes own project vault objects"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'documents-vault'
    and public.is_builder_owner((storage.foldername(name))[1]::uuid)
  );

create policy "customer reads own booking vault objects"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documents-vault'
    and public.is_booking_owner((storage.foldername(name))[2]::uuid)
  );
