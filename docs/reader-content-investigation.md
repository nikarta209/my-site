# Reader Content Loading Investigation

## Summary of the Failure
- **Symptom:** The reader showed the "Ошибка загрузки" state while the browser console logged `403` responses for requests to `https://<project>.supabase.co/storage/v1/object/public/books/...`.
- **Root Cause:** Book files are stored inside a *private* Supabase Storage bucket. Direct HTTP requests issued by the reader used unauthenticated public URLs, so Supabase rejected them with `403` and no text reached the pagination/notes logic.

## How Book Files Reach the Front-end Today
1. Metadata for a book contains one or more file references (`book.file_url`, language-specific URLs, etc.).
2. The legacy `getBookContent` helper simply looped over these URLs and called `fetch(url)`. It assumed the URLs were publicly readable and immediately converted the response to text.
3. When the bucket access policy changed to `private`, step 2 started failing for every book payload.

## Candidate Fixes Considered
1. **Signed downloads via the Supabase JS client (Selected).** Use the authenticated client to `download` blobs or mint signed links before requesting the payload. Works with any bucket visibility, keeps URLs short-lived, and reuses existing credentials stored in the app.
2. **Generate signed URLs on demand via an Edge Function.** Offload signing to a dedicated endpoint. Reliable and auditable, but introduces serverless latency and more infrastructure to maintain.
3. **Replicate book text into the database (Materialized preview).** Store a sanitized text column during upload so the reader never touches Storage. Removes Storage latency entirely but increases row size, complicates updates, and risks stale content.
4. **Proxy files through the KasBook backend.** A backend endpoint streams Storage blobs after verifying permissions. Centralizes access control but adds server load and bandwidth cost, and requires deploying/monitoring a new service.
5. **Switch Storage buckets back to `public` with RLS on metadata.** Simplest operationally but reintroduces the original security gap: anyone with the URL can download the full book, even without purchasing it.

## Recommended Approach
Option 1 keeps all access inside the authenticated Supabase client we already ship, avoids new infrastructure, and ensures the download inherits Supabase's auth rules. The reader now:
- Parses any `book.file_url` or language-specific paths.
- Tries a direct Storage `download` when possible.
- Falls back to signed URLs or the legacy public URL flow as a safety net.

This makes the reader resilient to bucket policy changes, supports previews, and keeps note/highlight logic untouched.
