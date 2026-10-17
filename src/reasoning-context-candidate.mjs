// Research-only, opt-in policy. This module does not call a model or modify
// current history. Integration requires an explicit controller authorization.
// The API's current_turn mode retains reasoning from the active user turn while
// declining to render available reasoning from earlier turns into a new sample.
// Context control is NOT a substitute for task state, tool evidence, or grading.
export const REASONING_CONTEXT_CANDIDATE = 'helix.research.current-turn.v1';

function failClosed(payload, status) {
  return {payload, stats: {candidate: REASONING_CONTEXT_CANDIDATE, status, changed: false}};
}

export function shapeCurrentTurnCandidate(payload, {enabled = false, authorized = false, signal} = {}) {
  if (!enabled) return failClosed(payload, 'disabled');
  if (signal?.aborted) return failClosed(payload, 'cancelled');
  if (authorized !== true) return failClosed(payload, 'authorization_required');
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.model !== 'gpt-6.1-sol') {
    return failClosed(payload, 'unsupported_model');
  }
  const reasoning = payload.reasoning;
  if (!reasoning || typeof reasoning !== 'object' || Array.isArray(reasoning) || reasoning.effort !== 'high') {
    return failClosed(payload, 'effort_not_high');
  }
  if (reasoning.context === 'current_turn') return failClosed(payload, 'already_current_turn');
  if (reasoning.context !== undefined && !['all_turns', 'auto'].includes(reasoning.context)) {
    return failClosed(payload, 'unrecognized_context_policy');
  }
  // Never remove input items, encrypted reasoning, tools, messages, or options.
  // The object is copied; the caller owns the decision to submit the request.
  const shaped = {...payload, reasoning: {...reasoning, context: 'current_turn'}};
  return {payload: shaped, stats: {candidate: REASONING_CONTEXT_CANDIDATE, status: 'candidate', changed: true}};
}

// Verify the effective policy on the actual provider response, not just in the
// request JSON. Missing/unsupported metadata is UNKNOWN, never success.
export function auditCurrentTurnResponse(response) {
  const effective = response?.reasoning?.context;
  if (effective === 'current_turn') return {status: 'verified', effective};
  if (effective === undefined || effective === null) return {status: 'unknown', effective: null};
  return {status: 'mismatch', effective};
}
