# Pulse — agent orientation

Unified contact-center + CRM stack. Read `README.md` for the authoritative app
table, capability list, feature flags, layout tree, and bring-up runbook. This
file is the short orientation; the README is the map.

## Apps

| Path | Port | Role |
|---|---|---|
| `apps/custom-dialer` | 8083 | Twilio Voice/SMS, ElevenLabs AI campaigns, Power/Group/Multi-Line dialer, DNC, Local Presence |
| `apps/dialer-next` | 8092 | Vite + React UI and Express gateway; proxies `/api/*`, verifies JWT cookies |
| `apps/crm` | 8091 | TypeScript + Express + Postgres; multi-org (THC + SEP), Entra ID OIDC SSO, enterprise platform surface |
| `apps/agent-assist` | 8095 | Standalone WS + Redis worker for live coaching and auto-QA |
| `apps/pulse-mobile` | — | Mobile client |

HTTP-facing apps talk through the `dialer-next` proxy and share identity via a
JWT-signed `dn_session` cookie. The dialer writes call and SMS events into the
CRM's `activity_log` through a cross-DB write-through.

## Non-negotiables

**Git is the source of truth.** `origin/main` of `thoomar/Pulse` is
authoritative for every deployed app. Edit in the repo, commit, push, then run
`deploy.sh` on the server. `deploy.sh` runs `git reset --hard origin/main`, so
anything not committed is destroyed on the next deploy. Live server files are
never a system of record.

**Never commit secrets.** `.env`, `.env.*`, `*.pem`, `*.key`, `*.secret`,
`monitor.env`, `ecosystem.config.js`, and anything holding tokens or passwords
stay on the server. Commit `*.example` templates.

**Most enterprise features are dark.** Flag-gated and default OFF in production,
so the running stack is byte-identical to "not shipped" until a flag is flipped
with `pm2 restart crm --update-env`. The registry is
`apps/crm/server/src/services/featureFlags.ts`.

**`custom-dialer` deploys manually.** `deploy.sh` skips it deliberately. Its
source still belongs in Git like everything else.

## If a module is missing, run the install script

Cloud agents boot from a **prebuilt environment snapshot**, not from a fresh
install. The snapshot's `node_modules` were installed from the lockfiles as they
were **when the build ran**, and an agent may then be handed newer code than that
— the environment pulls the latest default-branch commit once the build it started
from is older than the staleness threshold.

Whether that code pull *also* re-runs the install command is **not something
Cursor documents**, and we have not established it either way. The docs assign
`install` to build time and describe the stale pull as a code refresh, which is
the pessimistic reading; some older, pre-Builds material suggests install does
re-run. So treat new code over older `node_modules` as **possible, not certain**.

Either way the symptom to recognise is the same: `cannot find module 'x'` for a
package plainly present in `package.json` most likely means the dependency landed
after the snapshot was taken. That is an environment fact, not a bug in the code
you are reading, and not a reason to doubt the manifest. If install does re-run on
its own, you will simply never see it.

The fix, from the repo root:

```bash
bash .cursor/install.sh
```

Run it whenever a module is missing, or after checking out a branch that changes
any lockfile. **It is cheap and safe to run speculatively**: it stamps each
package's `node_modules` with a SHA-256 of that package's lockfile and skips the
reinstall when the hash still matches, so the no-change case is nine hash
comparisons and reinstalls only the package that actually moved. Nine lockfiles
means nine chances for exactly one of them to be the stale one.

Do not work around it by installing a single package by hand, and do not add a
dependency to make an import resolve. Both hide the drift from the next agent, who
will re-diagnose it from scratch.

## Branch naming

Every branch should say in its first path segment **who produced the work**,
because nothing else does: agents push with the owner's credential, so the author
field is `thoomar` on every PR in the repository. Pick a prefix:

- **`cursor/…`** — reserved. Cursor cloud agents name these themselves. Never
  hand-create one, and never rename one (the agent pushes to that exact ref).
- **`agent/<type>-<topic>`** — agent work that names itself: local background
  workers, and main-session agents working in a worktree. Use this whenever you
  are an agent creating your own branch.
- **`<type>/<topic>`** — human-authored only.

`<type>` is one of: `feat` `fix` `docs` `chore` `ci` `sec` `ops` `refactor`. Do
NOT use `feature` (use `feat`), `security` (use `sec`), or a component name as the
prefix (put it in the topic). Topics are lowercase-hyphenated and should name the
invariant being changed, not a ticket number. Branches that already exist are
grandfathered; this applies to ones created from here on.

It is a convention, not a gate — nothing in CI checks it. This guidance lives in
`AGENTS.md` rather than in `.cursor/rules/` on purpose: branch creation touches no
file, so it cannot be glob-scoped, and an `alwaysApply` rule would be a second
always-loaded file duplicating this one's job. Lifecycle rules (cut from
`origin/main`, ready-for-review not draft, serial merges, worktree hygiene), how
to land a PR through the serial merge queue, and the measured census are in
`docs/branch-naming-convention.md`.

## Where to look

- `docs/ARCHITECTURE.md` — system design
- `docs/DEPLOY.md` — deploy pipeline
- `docs/flag-desired-state.md` — intended flag states
- `docs/migration-guardrails.md` — migration safety
- `docs/branch-naming-convention.md` — branch naming + branch lifecycle

## Skills

Detailed procedures live in `.cursor/skills/` rather than in this file:

- `pulse-production-access` — operating production through the `pulse-ops-broker`
  Lambda: sessions, read-only triage, elevation and approval, host A/B topology,
  restart ordering.
- `pulse-definition-of-done` — the follow-through a change requires: Help Center
  content, root README, Asana roadmap, and **owning your PR through to a merge**
  rather than stopping at "opened, CI green".

`.cursor/rules/` holds exactly one `.mdc` rule — migration numbering and
checksums — and it is glob-scoped, so it loads automatically when you touch
`apps/crm/server/migrations/**/*.sql` and costs nothing otherwise. Anything that
cannot fire on a file pattern belongs in this file or in a skill, not there.
