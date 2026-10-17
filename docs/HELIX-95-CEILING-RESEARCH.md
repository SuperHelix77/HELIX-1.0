# HELIX 95% single-model ceiling — research protocol

**Research only.** No production switch, no measured savings claim, no permission to spend inference. This document targets Sol High without Lean Switch.

## Verified historical baseline

- Official same50 vanilla: 50,686,068 **known tokens**, 38/50 solves.
- HELIX V3: 11,288,140 **known tokens**, 34/50 solves; one non-overload request has unknown usage.
- The numerical 95%-savings ceiling is **2,534,303 known tokens** or fewer, with any unknown usage separately identified.
- Thus a 95% candidate must remove at least **8,753,837** additional known tokens, **77.55% of V3's remaining known expenditure**, *and* recover quality. Aggregate solve parity is not identical-task parity.
- Regressions that must be investigated: django__django-13220, sympy__sympy-20049, sympy__sympy-24909, sphinx-doc__sphinx-7686.

This is historical same50, not a newly randomized paired holdout. Do not label it a newly measured A/B test.

## Why shrinking context alone is insufficient

Analysis of nonpublic traces reports ~5.49M V3 known input tokens replaying earlier task items, including ~3.58M earlier reasoning tokens, plus ~3.05M repeated instructions/tools. These are *opportunity pools*, not independently removable guarantees.

Official Responses API guidance describes reasoning.context = current_turn. On supported models it renders the active-turn reasoning but not earlier-turn reasoning into a new sample. It does not lower reasoning.effort. Verify the effective response.reasoning.context for every live response. See: https://developers.openai.com/api/docs/guides/reasoning

The narrower analytical maximum for reasoning preceding the last real user-message boundary is ~2.84M input tokens. Even hypothetically removing all 2.84M while preserving output would leave ~8.448M V3 known tokens (~83.33% saved versus vanilla). **We must also consolidate model-decision boundaries and reduce recurring interface costs.**

## First isolated candidate

src/reasoning-context-candidate.mjs provides an **inert, opt-in request shape**, supported only on gpt-6.1-sol at reasoning.effort=high and only with an explicit controller authorization flag. Only reasoning.context changes; input messages, reasoning items, tools, instructions and output settings remain unchanged. This is NOT wired to the released proxy or benchmark controller. An actual controller must bind the authorization to an authenticated task/session and verify that current task obligations and evidence are recoverable.

Offline test: node --test test/reasoning-context-candidate.test.mjs. Missing provider effective-mode metadata is UNKNOWN, not a pass.

## Experiment ladder (independent arms; freeze each intervention)

0. **Zero-provider preflight:** exact request-diff tests, retained-evidence recovery, task-authority binding, missing-usage cases, model/mode compatibility, and fail-closed security tests.
1. **C1, reasoning-context only:** current_turn on Sol High. Preserve output settings, current reasoning, all messages/tools, current task scopes. Test memory recall and missing historic dependencies. If native Codex rejects or ignores the parameter, report unsupported; never silently change endpoints.
2. **C2, recurring interface only:** minimize redundant tool/schema prose or use existing lazy help, while preserving all required tool permissions and a stable cacheable prefix. Measure cached writes/reads, input, output and actual weighted spend separately.
3. **C3, request-frontier consolidation only:** deterministic execution of already-authorized mechanical operations, with typed dependencies, command bounds, failure gates, idempotency, cancellation and semantic review. Investigate Responses Programmatic Tool Calling only on actually compatible routes. See: https://developers.openai.com/api/docs/guides/tools-programmatic-tool-calling
4. **C4, combined:** measure the interactions; savings cannot be added arithmetically. First test four V3 lost solves, then a real, independently graded paired holdout.

A hypothetical scenario of **200 requests averaging 11,000 known input tokens, plus 75,814 known output and 150,000 overhead** totals **2,425,814** known tokens (95.21% below the historical vanilla known subtotal). This is *not an observed result*. Reducing V3's 420 requests to 200 safely is a major unresolved requirement.

## Hard gates

- No model routing, model downgrade, lower effort, hidden thinking cap, or quality gate relaxation.
- Unknown or failed tool operations stop mechanical continuation and return to model judgment. Never silently retry side-effecting operations.
- Preserve exact raw evidence, resolved obligations, current-turn reasoning, and cold recovery.
- Solver workspaces cannot see gold patches or grading solutions. Independent official grading is mandatory.
- All requests, retries, failures and unknown usage count. Do not convert synthetic token estimates into provider spend.
- Keep token reduction, cache-adjusted cost, wall-clock latency and subscription quota as **separate** metrics.
- Freeze and hash candidate/config/evidence before an explicitly approved live probe. Publish no new performance claim until real provider receipts and solve outcomes reconcile.
- Before promotion, prove at least vanilla-quality successful work at the same model and reasoning effort, then independently replicate.

## Downstream goal

Astra XHigh/Max research on Q38 is the reason to pursue this ceiling. The resulting actual usage or cost budget must be verified separately; 95% raw token savings would not by itself establish 20x more subscription quota.
