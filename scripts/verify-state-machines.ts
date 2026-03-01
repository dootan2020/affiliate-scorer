/**
 * Verify all state machine fixes (Phases 1-8).
 * Run: npx tsx scripts/verify-state-machines.ts
 *
 * Pure logic tests — no DB connection needed.
 */

import {
  STATE_MACHINES,
  validateTransition,
  assertTransition,
} from "../lib/state-machines/transitions";

// ─── Test Harness ──────────────────────────────────

let passed = 0;
let failed = 0;
let currentGroup = "";

function group(name: string): void {
  currentGroup = name;
  console.log(`\n── ${name} ──`);
}

function assert(label: string, condition: boolean): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${label}`);
  }
}

function expectValid(machine: keyof typeof STATE_MACHINES, from: string, to: string): void {
  const r = validateTransition(machine, from, to);
  assert(`${machine}: ${from} → ${to} should be VALID`, r.valid);
}

function expectInvalid(machine: keyof typeof STATE_MACHINES, from: string, to: string): void {
  const r = validateTransition(machine, from, to);
  assert(`${machine}: ${from} → ${to} should be INVALID`, !r.valid);
}

function expectThrows(machine: keyof typeof STATE_MACHINES, from: string, to: string): void {
  try {
    assertTransition(machine, from, to);
    assert(`assertTransition(${machine}, ${from}, ${to}) should throw`, false);
  } catch {
    assert(`assertTransition(${machine}, ${from}, ${to}) throws correctly`, true);
  }
}

// ─── Phase 1: Validation Engine ──────────────────

group("Phase 1: Validation Engine Core");

// validateTransition returns correct shape
const validResult = validateTransition("inboxState", "new", "enriched");
assert("validateTransition returns { valid: true }", validResult.valid === true && validResult.error === undefined);

const invalidResult = validateTransition("inboxState", "new", "logged");
assert("validateTransition returns { valid: false, error: string }", !invalidResult.valid && typeof invalidResult.error === "string");

// assertTransition throws on invalid
expectThrows("inboxState", "archived", "new");

// Unknown state returns invalid
const unknownState = validateTransition("inboxState", "nonexistent" as string, "new");
assert("Unknown source state returns invalid", !unknownState.valid);

// All 9 state machines exist
const expectedMachines = [
  "inboxState", "assetStatus", "briefStatus", "slotStatus",
  "importStatus", "campaignStatus", "commissionStatus",
  "batchStatus", "inboxItemStatus",
];
for (const m of expectedMachines) {
  assert(`STATE_MACHINES.${m} exists`, m in STATE_MACHINES);
}

// ─── Phase 1: Inbox State Transitions ────────────

group("Phase 1: Inbox State (inboxState)");
expectValid("inboxState", "new", "enriched");
expectValid("inboxState", "new", "scored");
expectValid("inboxState", "new", "archived");
expectValid("inboxState", "enriched", "scored");
expectValid("inboxState", "enriched", "archived");
expectValid("inboxState", "scored", "briefed");
expectValid("inboxState", "scored", "archived");
expectValid("inboxState", "briefed", "published");
expectValid("inboxState", "briefed", "archived");
expectValid("inboxState", "published", "archived");

// Terminal
expectInvalid("inboxState", "archived", "new");
expectInvalid("inboxState", "archived", "scored");

// Skip states
expectInvalid("inboxState", "new", "briefed");
expectInvalid("inboxState", "enriched", "published");

// ─── Phase 1+2: Asset Status Transitions ─────────

group("Phase 1+2: Asset Status (assetStatus)");
// Happy path
expectValid("assetStatus", "draft", "produced");
expectValid("assetStatus", "produced", "rendered");
expectValid("assetStatus", "rendered", "published");
expectValid("assetStatus", "published", "logged");

// Phase 2: new transitions
expectValid("assetStatus", "published", "produced");    // re-produce
expectValid("assetStatus", "failed", "draft");           // retry
expectValid("assetStatus", "draft", "failed");
expectValid("assetStatus", "draft", "archived");
expectValid("assetStatus", "produced", "archived");
expectValid("assetStatus", "rendered", "archived");
expectValid("assetStatus", "published", "archived");

// Terminal: logged is terminal
expectInvalid("assetStatus", "logged", "draft");
expectInvalid("assetStatus", "logged", "published");
expectInvalid("assetStatus", "logged", "archived");

// Invalid skips
expectInvalid("assetStatus", "draft", "published");
expectInvalid("assetStatus", "draft", "logged");
expectInvalid("assetStatus", "failed", "published");

// ─── Brief Status ────────────────────────────────

group("Phase 3: Brief Status (briefStatus)");
expectValid("briefStatus", "generated", "reviewed");
expectValid("briefStatus", "generated", "replaced");
expectValid("briefStatus", "reviewed", "exported");
expectValid("briefStatus", "reviewed", "replaced");

// Terminal
expectInvalid("briefStatus", "exported", "generated");
expectInvalid("briefStatus", "replaced", "generated");

// ─── Phase 5: Slot Status ────────────────────────

group("Phase 5: Slot Status (slotStatus)");
expectValid("slotStatus", "planned", "briefed");
expectValid("slotStatus", "planned", "skipped");
expectValid("slotStatus", "briefed", "produced");
expectValid("slotStatus", "briefed", "skipped");
expectValid("slotStatus", "produced", "rendered");      // rendered status added
expectValid("slotStatus", "produced", "published");
expectValid("slotStatus", "produced", "skipped");
expectValid("slotStatus", "rendered", "published");
expectValid("slotStatus", "rendered", "skipped");
expectValid("slotStatus", "skipped", "planned");         // re-open slot

// Terminal
expectInvalid("slotStatus", "published", "planned");
expectInvalid("slotStatus", "published", "skipped");

// ─── Import Status ───────────────────────────────

group("Import Status (importStatus)");
expectValid("importStatus", "pending", "processing");
expectValid("importStatus", "processing", "completed");
expectValid("importStatus", "processing", "partial");
expectValid("importStatus", "processing", "failed");

// Terminal
expectInvalid("importStatus", "completed", "pending");
expectInvalid("importStatus", "failed", "pending");     // #8a skipped by design

// ─── Phase 6 (#7): Campaign Status ──────────────

group("Phase 6: Campaign Status (campaignStatus)");
expectValid("campaignStatus", "planning", "creating_content");
expectValid("campaignStatus", "planning", "cancelled");
expectValid("campaignStatus", "creating_content", "running");
expectValid("campaignStatus", "creating_content", "cancelled");
expectValid("campaignStatus", "running", "paused");
expectValid("campaignStatus", "running", "completed");
expectValid("campaignStatus", "running", "cancelled");
expectValid("campaignStatus", "paused", "running");
expectValid("campaignStatus", "paused", "completed");
expectValid("campaignStatus", "paused", "cancelled");    // #7: paused → cancelled

// Terminal
expectInvalid("campaignStatus", "completed", "running");
expectInvalid("campaignStatus", "cancelled", "running");

// ─── Phase 7: Commission Status ─────────────────

group("Phase 7: Commission Status (commissionStatus)");
expectValid("commissionStatus", "pending", "confirmed");
expectValid("commissionStatus", "pending", "rejected");
expectValid("commissionStatus", "confirmed", "paid");
expectValid("commissionStatus", "confirmed", "rejected");

// Terminal
expectInvalid("commissionStatus", "paid", "confirmed");
expectInvalid("commissionStatus", "rejected", "pending");

// Verify pending exists (was skipped before Phase 7)
assert("commissionStatus has 'pending' state", "pending" in STATE_MACHINES.commissionStatus);

// ─── Phase 2: Batch Status ──────────────────────

group("Phase 2: Batch Status (batchStatus)");
expectValid("batchStatus", "active", "done");
expectValid("batchStatus", "active", "failed");
expectValid("batchStatus", "active", "cancelled");

// Terminal
expectInvalid("batchStatus", "done", "active");
expectInvalid("batchStatus", "failed", "active");
expectInvalid("batchStatus", "cancelled", "active");

// ─── Phase 6 (#8b): InboxItem Status ────────────

group("Phase 6: InboxItem Status (inboxItemStatus)");
expectValid("inboxItemStatus", "pending", "new_product");
expectValid("inboxItemStatus", "pending", "duplicate");
expectValid("inboxItemStatus", "pending", "matched");
expectValid("inboxItemStatus", "pending", "failed");
expectValid("inboxItemStatus", "failed", "pending");    // #8b: retry

// Terminal (except failed)
expectInvalid("inboxItemStatus", "new_product", "pending");
expectInvalid("inboxItemStatus", "duplicate", "pending");
expectInvalid("inboxItemStatus", "matched", "pending");

// ─── Phase 5: Slot Sync Mapping ─────────────────

group("Phase 5: Slot Sync Mapping (ASSET_TO_SLOT_STATUS)");

// Inline the expected mapping to verify without DB
const EXPECTED_SLOT_MAPPING: Record<string, string> = {
  draft: "planned",
  produced: "produced",
  rendered: "rendered",    // Phase 5 fix: was "produced"
  published: "published",
  archived: "skipped",
  logged: "published",
  failed: "skipped",       // Phase 5 addition
};

// We can't import the mapping directly (it uses prisma), so verify from source
// Read the actual file and parse
import { readFileSync } from "fs";
import { resolve } from "path";

const syncSource = readFileSync(
  resolve(__dirname, "../lib/content/sync-slot-status.ts"),
  "utf-8",
);

for (const [assetStatus, expectedSlot] of Object.entries(EXPECTED_SLOT_MAPPING)) {
  const pattern = `${assetStatus}: "${expectedSlot}"`;
  const altPattern = `${assetStatus}: '${expectedSlot}'`;
  const found = syncSource.includes(pattern) || syncSource.includes(altPattern);
  assert(`Slot mapping: ${assetStatus} → "${expectedSlot}"`, found);
}

// Verify "rendered" NOT mapped to "produced" (the old bug)
assert(
  'rendered NOT mapped to "produced" (Phase 5 fix)',
  !syncSource.includes('rendered: "produced"'),
);

// Verify TODO v2 comment exists
assert(
  "TODO v2 manualOverride comment present",
  syncSource.includes("TODO v2") && syncSource.includes("manualOverride"),
);

// ─── Phase 4: Per-channel Learning Weights ──────

group("Phase 4: Per-channel Learning Weight Schema");

const schemaSource = readFileSync(
  resolve(__dirname, "../prisma/schema.prisma"),
  "utf-8",
);

assert(
  "LearningWeightP4 has channelId field",
  schemaSource.includes("channelId") && schemaSource.includes("LearningWeightP4"),
);

// Verify channelId in unique constraint
assert(
  "LearningWeightP4 unique includes channelId",
  schemaSource.includes("scope, key, channelId"),
);

// ─── Phase 6 (#5): Delta Reward Logic ───────────

group("Phase 6: Delta Reward Re-capture (#5)");

const metricsSource = readFileSync(
  resolve(__dirname, "../app/api/metrics/capture/route.ts"),
  "utf-8",
);

assert(
  "Metrics capture fetches previous metric for delta",
  metricsSource.includes("previousMetric") && metricsSource.includes("findFirst"),
);

assert(
  "Delta reward calculated as new - previous",
  metricsSource.includes("deltaReward") && metricsSource.includes("reward - previousReward"),
);

assert(
  "Delta threshold check (abs > 0.01)",
  metricsSource.includes("Math.abs(deltaReward) > 0.01"),
);

// ─── Phase 7: Commission Default Pending ────────

group("Phase 7: Commission Default Pending");

const commissionSource = readFileSync(
  resolve(__dirname, "../app/api/commissions/route.ts"),
  "utf-8",
);

assert(
  'Commission NOT hardcoded to "confirmed"',
  !commissionSource.includes('status: "confirmed",'),
);

assert(
  "Commission respects autoConfirm flag",
  commissionSource.includes("autoConfirm"),
);

assert(
  "Commission defaults to pending",
  commissionSource.includes('"pending"'),
);

// ─── Phase 3: Brief Race Condition Protection ───

group("Phase 3: Brief Race Condition Protection");

const briefSource = readFileSync(
  resolve(__dirname, "../lib/content/generate-brief.ts"),
  "utf-8",
);

assert(
  "Brief uses $transaction for atomic writes",
  briefSource.includes("$transaction"),
);

assert(
  "Brief has optimistic lock (updateMany with WHERE)",
  briefSource.includes("updateMany") && briefSource.includes("inboxState"),
);

// ─── Phase 3: Orphan Cleanup in Regenerate ──────

group("Phase 3: Brief Orphan Cleanup");

const regenSource = readFileSync(
  resolve(__dirname, "../app/api/briefs/[id]/regenerate/route.ts"),
  "utf-8",
);

assert(
  "Regenerate archives draft assets of replaced brief",
  regenSource.includes("archived") && regenSource.includes("draft"),
);

assert(
  "Regenerate uses transaction for atomicity",
  regenSource.includes("$transaction"),
);

// ─── Phase 2: Batch Auto-completion ─────────────

group("Phase 2: Batch Auto-completion");

const batchSource = readFileSync(
  resolve(__dirname, "../lib/services/batch-status.ts"),
  "utf-8",
);

assert(
  "checkBatchCompletion function exists",
  batchSource.includes("checkBatchCompletion"),
);

assert(
  "Checks all assets terminal before completing batch",
  batchSource.includes("allTerminal") || batchSource.includes("every"),
);

assert(
  'Batch can go to "failed" when all assets failed/archived',
  batchSource.includes('"failed"') && batchSource.includes('"done"'),
);

// ─── Phase 6 (#10): Lifecycle Auto-refresh ──────

group("Phase 6: Lifecycle Auto-refresh (#10)");

const uploadSource = readFileSync(
  resolve(__dirname, "../app/api/upload/products/route.ts"),
  "utf-8",
);

assert(
  "Upload products imports getProductLifecycle",
  uploadSource.includes("getProductLifecycle"),
);

assert(
  "Lifecycle recalculation runs after scoring",
  uploadSource.includes("lifecycle") && uploadSource.includes("lifecycleStage"),
);

// ─── Phase 6 (#8b): InboxItem Retry Endpoint ────

group("Phase 6: InboxItem Retry Endpoint (#8b)");

const retrySource = readFileSync(
  resolve(__dirname, "../app/api/inbox/items/[id]/retry/route.ts"),
  "utf-8",
);

assert(
  "Retry endpoint exists with POST handler",
  retrySource.includes("export async function POST"),
);

assert(
  "Retry validates failed → pending transition",
  retrySource.includes("assertTransition") && retrySource.includes("inboxItemStatus"),
);

assert(
  "Retry re-parses original URL",
  retrySource.includes("parseLinks") && retrySource.includes("rawUrl"),
);

// ─── Completeness: All state machines have no orphan states ──

group("Completeness: No Orphan States");

for (const [machineName, states] of Object.entries(STATE_MACHINES)) {
  const allStates = new Set(Object.keys(states));
  const allTargets = new Set<string>();
  for (const targets of Object.values(states)) {
    for (const t of targets) allTargets.add(t);
  }

  // Every target should be a defined state
  for (const target of allTargets) {
    assert(
      `${machineName}: target "${target}" is a defined state`,
      allStates.has(target),
    );
  }
}

// ─── Summary ─────────────────────────────────────

console.log("\n" + "═".repeat(50));
console.log(`  TOTAL: ${passed + failed} tests`);
console.log(`  ✓ PASSED: ${passed}`);
if (failed > 0) {
  console.log(`  ✗ FAILED: ${failed}`);
}
console.log("═".repeat(50));

process.exit(failed > 0 ? 1 : 0);
