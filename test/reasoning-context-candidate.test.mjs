import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shapeCurrentTurnCandidate, auditCurrentTurnResponse,
  REASONING_CONTEXT_CANDIDATE,
} from '../src/reasoning-context-candidate.mjs';

const make = () => ({
  model: 'gpt-6.1-sol',
  reasoning: {effort: 'high', context: 'all_turns', summary: 'auto'},
  text: {verbosity: 'medium'},
  instructions: 'Keep all task obligations and evidence recoverable.',
  previous_response_id: 'resp_synthetic_previous',
  input: [
    {type: 'message', role: 'user', content: 'Synthetic current SWE task'},
    {type: 'reasoning', encrypted_content: 'SYNTHETIC_OPAQUE_PRESERVE'},
    {type: 'function_call', call_id: 'call_test', name: 'exec', arguments: '{}'},
    {type: 'function_call_output', call_id: 'call_test', output: 'test completed'},
  ],
  tools: [{type: 'function', name: 'exec', parameters: {type: 'object'}}],
  parallel_tool_calls: false,
});

test('disabled and unauthorised candidates leave the exact original reference unchanged', () => {
  const payload = make();
  for (const opts of [{}, {enabled: true}, {enabled: true, authorized: false}]) {
    const result = shapeCurrentTurnCandidate(payload, opts);
    assert.equal(result.payload, payload);
    assert.equal(result.stats.changed, false);
  }
});

test('high-effort Sol changes exactly reasoning.context without mutating input or configuration', () => {
  const payload = make(), before = structuredClone(payload);
  const result = shapeCurrentTurnCandidate(payload, {enabled: true, authorized: true});
  assert.equal(result.stats.candidate, REASONING_CONTEXT_CANDIDATE);
  assert.equal(result.stats.status, 'candidate');
  assert.equal(result.stats.changed, true);
  assert.equal(result.payload.reasoning.context, 'current_turn');
  assert.deepEqual(payload, before);
  assert.deepEqual(result.payload, {...before, reasoning: {...before.reasoning, context: 'current_turn'}});
  for (const key of Object.keys(before).filter(key => key !== 'reasoning')) {
    assert.equal(result.payload[key], payload[key]);
  }
  assert.equal(result.payload.reasoning.effort, 'high');
  assert.equal(result.payload.input[1].encrypted_content, 'SYNTHETIC_OPAQUE_PRESERVE');
});

test('abort, unsupported model, non-high effort, malformed context fail closed', () => {
  const input = make();
  const cases = [
    [{...input, model: 'gpt-other'}, {}, 'unsupported_model'],
    [{...input, reasoning: {...input.reasoning, effort: 'medium'}}, {}, 'effort_not_high'],
    [{...input, reasoning: undefined}, {}, 'effort_not_high'],
    [{...input, reasoning: {...input.reasoning, context: 'unknown'}}, {}, 'unrecognized_context_policy'],
    [input, {signal: AbortSignal.abort()}, 'cancelled'],
  ];
  for (const [payload, extras, status] of cases) {
    const result = shapeCurrentTurnCandidate(payload, {enabled: true, authorized: true, ...extras});
    assert.equal(result.payload, payload);
    assert.equal(result.stats.status, status);
    assert.equal(result.stats.changed, false);
  }
});

test('already current_turn and auto context are handled without losing other fields', () => {
  for (const context of ['current_turn', 'auto', undefined]) {
    const payload = {...make(), reasoning: {...make().reasoning, context}};
    const out = shapeCurrentTurnCandidate(payload, {enabled: true, authorized: true});
    assert.equal(out.payload.reasoning.context, 'current_turn');
    assert.equal(out.stats.changed, context !== 'current_turn');
  }
});

test('provider effective mode must be checked; missing is UNKNOWN', () => {
  assert.deepEqual(auditCurrentTurnResponse({reasoning: {context: 'current_turn'}}), {status: 'verified', effective: 'current_turn'});
  assert.deepEqual(auditCurrentTurnResponse({reasoning: {context: 'all_turns'}}), {status: 'mismatch', effective: 'all_turns'});
  assert.deepEqual(auditCurrentTurnResponse({reasoning: {}}), {status: 'unknown', effective: null});
  assert.deepEqual(auditCurrentTurnResponse(null), {status: 'unknown', effective: null});
});
