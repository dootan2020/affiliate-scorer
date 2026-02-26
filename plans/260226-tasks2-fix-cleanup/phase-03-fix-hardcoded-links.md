# Phase 3 — Fix Hardcoded Links (Nhóm 2)

## Priority: MEDIUM

## Known Fixes (from TASKS-2.md)
| File | Current | Fix |
|------|---------|-----|
| `components/insights/insights-page-client.tsx` ~157 | `href="/upload"` | `href="/sync"` |
| `components/insights/overview-tab.tsx` ~230 | `href="/products"` | `href="/inbox"` |
| `app/shops/page.tsx` ~180 | `href="/products"` | `href="/inbox"` |

## Additional Findings (from codebase scan)
| File | Line | Current | Fix |
|------|------|---------|-----|
| `app/api/morning-brief/brief-intelligence-enricher.ts` | 67 | `/products?sort=newest` | `/inbox` |
| `app/api/morning-brief/brief-intelligence-enricher.ts` | 19 | `/campaigns` | Remove or update |
| `app/api/morning-brief/brief-campaign-analyzer.ts` | 32,43,58,69,87 | `/campaigns/${id}` | Remove (will be cleaned in Phase 4 with morning brief rewrite) |

## Full Codebase Scan
Search for these patterns in .tsx/.ts (exclude node_modules, .next, redirects):
- `"/upload"` → should be `/sync`
- `"/products"` → should be `/inbox` (except API routes)
- `"/feedback"` → remove or update
- `"/campaigns"` → remove or update
- `"/playbook"` → should be `/insights?tab=playbook`

## Implementation
1. Fix 3 known files
2. Run full codebase grep for old routes in JSX
3. Fix any additional occurrences
4. TypeScript compile check
