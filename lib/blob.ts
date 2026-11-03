/**
 * Whether Vercel Blob credentials are available on the server.
 * New Vercel stores connect via OIDC (BLOB_STORE_ID; Vercel supplies the OIDC token),
 * older setups use a BLOB_READ_WRITE_TOKEN.
 */
export function blobConfigured() {
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
}
