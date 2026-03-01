// Central state machine definitions and transition validation.
// All state transitions in the codebase MUST go through validateTransition() or assertTransition().

export const STATE_MACHINES = {
  inboxState: {
    new: ["enriched", "scored", "archived"],
    enriched: ["scored", "archived"],
    scored: ["briefed", "archived"],
    briefed: ["published", "archived"],
    published: ["archived"],
    archived: [],
  },

  assetStatus: {
    draft: ["produced", "failed", "archived"],
    produced: ["rendered", "archived"],
    rendered: ["published", "archived"],
    published: ["logged", "archived", "produced"],
    logged: [],
    failed: ["draft"],
    archived: [],
  },

  briefStatus: {
    generated: ["reviewed", "replaced"],
    reviewed: ["exported", "replaced"],
    exported: [],
    replaced: [],
  },

  slotStatus: {
    planned: ["briefed", "skipped"],
    briefed: ["produced", "skipped"],
    produced: ["rendered", "published", "skipped"],
    rendered: ["published", "skipped"],
    published: [],
    skipped: ["planned"],
  },

  importStatus: {
    pending: ["processing"],
    processing: ["completed", "partial", "failed"],
    completed: [],
    partial: [],
    failed: [],
  },

  campaignStatus: {
    planning: ["creating_content", "cancelled"],
    creating_content: ["running", "cancelled"],
    running: ["paused", "completed", "cancelled"],
    paused: ["running", "completed", "cancelled"],
    completed: [],
    cancelled: [],
  },

  commissionStatus: {
    pending: ["confirmed", "rejected"],
    confirmed: ["paid", "rejected"],
    paid: [],
    rejected: [],
  },

  batchStatus: {
    active: ["done", "failed", "cancelled"],
    done: [],
    failed: [],
    cancelled: [],
  },

  inboxItemStatus: {
    pending: ["new_product", "duplicate", "matched", "failed"],
    new_product: [],
    duplicate: [],
    matched: [],
    failed: ["pending"],
  },
} as const;

// Type helpers derived from the state machine definitions
export type StateMachineKey = keyof typeof STATE_MACHINES;
export type InboxState = keyof typeof STATE_MACHINES.inboxState;
export type AssetStatus = keyof typeof STATE_MACHINES.assetStatus;
export type SlotStatus = keyof typeof STATE_MACHINES.slotStatus;
export type BatchStatus = keyof typeof STATE_MACHINES.batchStatus;

/**
 * Validate whether a state transition is allowed.
 * Returns { valid: true } or { valid: false, error: "..." }.
 */
export function validateTransition(
  machine: StateMachineKey,
  from: string,
  to: string,
): { valid: boolean; error?: string } {
  const states = STATE_MACHINES[machine] as Record<string, readonly string[]>;
  const allowedNext = states[from];

  if (!allowedNext) {
    return { valid: false, error: `Trạng thái "${from}" không hợp lệ cho ${machine}` };
  }

  if (!allowedNext.includes(to)) {
    return {
      valid: false,
      error: `Không thể chuyển ${machine} từ "${from}" → "${to}". Cho phép: [${allowedNext.join(", ")}]`,
    };
  }

  return { valid: true };
}

/**
 * Assert a transition is valid — throws Error if not.
 * Use in service functions where invalid transition = programming error.
 */
export function assertTransition(
  machine: StateMachineKey,
  from: string,
  to: string,
): void {
  const result = validateTransition(machine, from, to);
  if (!result.valid) {
    throw new Error(result.error);
  }
}
