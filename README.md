# review-bakeoff

Throwaway. Scores AI pull-request reviewers against defects that **actually
shipped in Pulse** and were caught late or not at all.

## Why not the usual benchmark

An earlier probe seeded six textbook lint defects — comparison of identical
operands, unreachable code, a discarded promise. Copilot found **6 of 6**, which
means the sample did not discriminate: it ranked nothing. A benchmark everyone
passes is not a benchmark.

The bait here is drawn from this codebase's own escape history. Each defect is a
real class that reached `main`, survived CI, and cost something to find.

## The bait

The `bakeoff` branch introduces eight defects against the baseline on `main`.
Scoring key is deliberately **not** in this repository — it lives with the
operator, so a reviewer that reads the repo cannot read the answers.

Structure mirrors Pulse's real paths, because several of the defects are only
recognisable to a reviewer that knows what a path means: a migration under
`apps/crm/server/migrations/` is subject to checksum drift, and one under
`apps/custom-dialer/migrations/` is not.

`AGENTS.md` and `.cursor/BUGBOT.md` are copied verbatim from Pulse so each tool
gets the same repository context it would have in the real thing.
