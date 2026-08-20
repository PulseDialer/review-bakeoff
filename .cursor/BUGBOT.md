# Bugbot review guide — Pulse

Pulse is a contact-center + CRM stack: four Node apps (`apps/custom-dialer`,
`apps/dialer-next`, `apps/crm`, `apps/agent-assist`) plus `apps/pulse-mobile`,
two Postgres instances, one nginx, one Twilio account, one ElevenLabs project.
`origin/main` is the single source of truth; the server is hard-reset to it by
`deploy.sh` on every deploy.

Flag the following. These are ordered roughly by blast radius.

## Secrets in the diff

Never approve a commit containing `.env`, `.env.*`, `*.pem`, `*.key`,
`*.secret`, `monitor.env`, `ecosystem.config.js`, `.zoho-creds.local.json`,
`ssm_params.json`, or any file with inline tokens, passwords, connection
strings, or API keys. These live only on the server. The repo commits
`*.example` templates instead.

Treat a hardcoded credential in source as a blocking finding even when the
surrounding code is otherwise correct.

## CRM migrations — `apps/crm/server/migrations/NNNN_name.sql`

These are the highest-risk files in the repo because the runner cannot catch
the mistakes.

**Editing a migration that has already been applied is a blocking finding, even
for a comment or whitespace change.** `computeChecksum` hashes the entire file,
and `reportChecksumDrift` runs on both `migrate status` and `migrate up`. An
edit makes every database that already recorded the old checksum warn forever,
while databases initialised afterwards record the new one and never warn. No
single file state satisfies both, and reverting the edit does not undo the
divergence. If a migration's comments are wrong, the correction belongs in
`docs/` with a cross-reference — not in the file.

**Duplicate `NNNN` prefixes fail silently.** `schema_migrations` is keyed on the
full filename minus `.sql`, so `0087_alpha` and `0087_beta` both apply and
neither errors. Check any newly added migration number against the rest of the
tree and flag collisions.

**Renaming an applied migration applies it a second time**, because the new
filename is a version the runner has never seen.

Migrations must be additive and idempotent — `ADD COLUMN IF NOT EXISTS`,
`CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`. The runner is
forward-only with no `down` command. Flag any destructive or non-idempotent
statement.

Note that `apps/custom-dialer/migrations/` is a separate set for a different app
and database, with different conventions. These rules do not apply to it.

## Feature flags

Most of the enterprise surface is deliberately dark. A new flag must default to
**OFF** and be registered in
`apps/crm/server/src/services/featureFlags.ts`. Flag a new flag that defaults ON,
or a flag-gated code path that can execute before its flag is checked.

## Definition of done

Flag a PR that adds or changes a user-facing feature or an Admin section without
a matching update to `apps/dialer-next/client/src/help/content.ts`. A new
`AdminPage` `TAB_GROUPS` entry also needs a `TAB_HELP` mapping. Help article ids
are deep-link anchors — flag any renamed id whose `HelpLink` / `useHelpLink`
references were not updated with it.

Flag a PR that adds an app, service, port, capability, feature flag, top-level
directory, or deploy step without updating root `README.md`.

## Code conventions

Imports belong at the top of the module. Flag inline imports in function bodies,
type annotations, or interface fields unless a circular-dependency reason is
documented in a comment.

In TypeScript `switch` statements over discriminated unions or enums, require a
`never` check in the `default` case so new variants fail at compile time.

## Deploy coupling

`deploy.sh` intentionally excludes `apps/custom-dialer`, which is deployed
manually — but its source must still be kept in sync in Git. Flag a change that
assumes custom-dialer ships automatically with a normal deploy.

Anything not committed is destroyed by the next `deploy.sh`, which runs
`git reset --hard origin/main`. Flag comments or docs in a diff that describe
live-server state as authoritative.
