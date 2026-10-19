# Per-client config

Everything that changes when this demo becomes a real client's site.

**Status:** about half of it is already in `assets/data.js`. The rest is hardcoded in the page templates. Brief 5 says not to finish the one-file refactor until a client says yes. Doing it then takes about 2–3 hours; until then, use this list.

## Already in `assets/data.js`

| Key | What it controls |
|---|---|
| `event.name`, `event.host` | Confirmation page, email preview, calendar file |
| `event.dates`, `event.startISO`, `event.endISO` | Email banner, calendar file |
| `event.venue`, `event.town` | Email footer, calendar location |
| `event.fee` | Dashboard totals, stored registrations |
| `event.deadline`, `event.capacity` | (not displayed yet) |
| `event.email` | "From" line in the confirmation email |
| `builder.name`, `builder.url` | "Built by" credit in the footer |
| `teams` | Team names, coaches and roster sizes (demo seed; empty for a real client) |
| `ages[div].pools`, `ages[div].fields` | Divisions, pools per division, which fields each division uses |
| `poolScores`, `poolTimes` | Pool results and Saturday time slots |
| `bracket[div]` | Bracket results, statuses and game notes |
| `unpaidSeed` | Demo-only unpaid teams |

## Still hardcoded (move into `data.js` when a client signs)

| Value | Where |
|---|---|
| Event name, divisions, dates in the header | `partials/head.html` (title suffix, brand subtitle, demo strip) |
| Demo notice | `partials/foot.html`, `partials/head.html` (delete for clients) |
| Hero copy, fee, dates, field count, deadline, "14 of 16" spots | `src/index.html` |
| Division radio buttons (12U/14U + birth years) | `src/register.html` |
| Pool letters per division | `src/register.js` (`POOLS`) |
| Roster min/max (9–15) | `src/register.html`, `src/register.js` |
| Fee on the pay button and the Stripe hint | `src/register.html`, `src/register.js` |
| Stripe amount (49500) and product name | `api/checkout.js` |
| Division tabs | `src/bracket.html`, `src/bracket.js` |
| Bracket shape (8 teams: QF → SF → Final), seed pairings, Sunday times | `assets/common.js` (`bracketFor`, `schedule`) |
| Field map (4 diamonds, layout) and "Need to know" list | `src/fields.html`, `src/fields.js` |
| Day filter options (Sat/Sun dates) | `src/fields.html` |
| Confirmation email "what happens next" dates | `src/confirmed.js` |

## Structural limits to know before quoting

- The bracket code assumes **8 teams per division, 2 pools of 4**. A 6-, 10- or 12-team division needs byes or a different bracket shape (~2 hours extra).
- Scores live in `data.js`, so updating them means a redeploy. Fine for a demo. For live events, scores need a small database or a sheet the director edits; that's what the monthly retainer covers.
- The operator dashboard is unauthenticated in the demo. A real client needs a login or a secret link before launch.
