import { supabase } from './supabase'

// Private, encrypted-at-rest Supabase Storage bucket for booking-scoped
// documents. Never made public — every read goes through a freshly minted,
// short-lived signed URL (see getVaultFileUrl), so there is never a durable
// link that could leak or be shared past the moment it was requested.
const VAULT_BUCKET = 'documents-vault'
const SIGNED_URL_TTL_SECONDS = 60

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function uploadVaultFile(params: { projectId: string; bookingId: string; file: File }) {
  if (!supabase) return { path: null, error: new Error('Supabase is not configured') }
  const { projectId, bookingId, file } = params
  const path = `${projectId}/${bookingId}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`

  const { error } = await supabase.storage.from(VAULT_BUCKET).upload(path, file, {
    cacheControl: '0',
    upsert: false,
  })
  if (error) return { path: null, error }
  return { path, error: null }
}

export async function getVaultFileUrl(storagePath: string) {
  if (!supabase) return { url: null, error: new Error('Supabase is not configured') }
  const { data, error } = await supabase.storage.from(VAULT_BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)
  if (error) return { url: null, error }
  return { url: data.signedUrl, error: null }
}
