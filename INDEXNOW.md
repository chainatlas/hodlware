# IndexNow

- Public key file: https://hodlware.de/67c781f634734bc78b734802d795d817.txt (public ownership proof, not a shop credential).
- Existing Cloudflare Git deployment is unchanged. Build publishes a commit-tagged manifest derived only from indexable sitemap pages and their referenced public assets. Cache-only version changes do not change page fingerprints.
- GitHub Actions runs on main pushes or manual dispatch, using built-in Node and the automatic GITHUB_TOKEN. It waits up to 12 minutes for that exact commit on hodlware.de; failed, preview and superseded deployments send nothing. No Cloudflare/Stripe/Resend secrets are needed.
- Changed/new URLs are checked against the live sitemap, HTTP 200, HTML, robots headers/meta and canonical before a single IndexNow POST. 200 means received; 202 means received with ownership verification pending. Neither promises indexing.
- Persistent successful fingerprints and the latest response/URL list are in state.json on the separate indexnow-state branch. That branch uses [skip ci] commits, so Cloudflare does not deploy it; main is never changed by the notifier. Normal reruns send no duplicate batch. No expiring Actions artifacts/cache or new paid services.
- Errors fail the Action and do not advance successful state. No automatic POST retries; inspect a transport timeout before manually rerunning because delivery can be ambiguous. State-write failure after a received POST also needs review before retrying.
- Actions logs and run summary contain submitted public URLs, deployment SHA and HTTP status. The initial successful run submits all eligible sitemap pages once. Future runs submit only changes since the accepted state. Removed/non-indexable pages are excluded under this site's sitemap-only policy.
