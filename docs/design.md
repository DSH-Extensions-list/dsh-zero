# DSH Zero design

Date: 2026-10-08
Status: Approved and implemented; live model quality evaluation remains pending.

## Purpose

Build an installable DSH plugin that brings the useful behavior of CodexZero to whichever model the user selects. The user requested a CodexZero alternative for DSH and explicitly requires model independence. The intended benefit is less wasted context and fewer unnecessary model round trips, with complete output recovery and visible measurements. Task quality must be evaluated alongside savings.

Working name: DSH Zero. This name is a proposal.

## Approach

Use native Cordis tool-result policies, DSH spill storage, native tool execution, and client settings. A shell wrapper would miss other tools and require different workflows. A Harness fork would allow deeper changes but couple releases to upstream internals. A plugin is the recommended first release.

Verified against local Harness commit `639ed015397290b3745d163aafe02ffee4aa3f84`: `tools/post-execute` can replace result projections; `spillStore.saveText` saves verbatim session-owned text with retrieval guidance. Agent-loop model requests are frozen and must not be rewritten through `llm/stream`. The built-in token meter uses a fixed character-density heuristic, not exact model tokenization.

## First release

1. Reversible text compression. Encode repeated consecutive lines or blocks with unambiguous markers and counts. Preserve order, line endings, final-newline state, and all unique text. Verify decode equality before accepting a candidate. Never filter lines by keywords or successful exit status. Leave images and unsupported content blocks intact.
2. Full output recovery. Save original text through native spill storage before selecting compressed content. Include native recovery guidance. Storage failure, unsupported results, missing session ownership, or codec failure returns original content. Preserve error state, exit/process metadata, call identity, and structured program values.
3. Safe and lean modes. Safe uses normal DSH instructions and output compression. Lean additionally registers a short optional guidance section encouraging targeted reads, concise updates, and stopping after adequate verification. It supplements existing instructions. Both modes expose an off switch. Safe is the initial default; lean can change model behavior and must be benchmarked separately.
4. Savings and output viewer. Add a settings page with mode controls and counters for original/retained bytes, estimated token reduction, exact counts where supported, recovery overhead, and bypass reasons. Expose full saved outputs through existing authenticated host capabilities. Counters do not contain raw conversation text.
5. Model independence. No provider credentials, inference routing, or hardcoded model requirement. Add a tokenizer capability seam keyed by provider/model identity. Exact mode selects a candidate only when its complete payload, including recovery notice and framing, has fewer tokens. Without an exact tokenizer, offer clearly labeled estimated mode with a minimum reduction threshold; strict exact-only mode leaves original output unchanged. Never claim byte reduction guarantees token or billing reduction.

## Compatibility boundaries

Post-execute replacement affects the durable result projection, so stock UI may display compressed text. The plugin must provide an explicit full-output view; identical stock inline rendering is not promised. Original canonical program values must remain available to DSH code-mode tools. Compression must compose with existing spill policies without double processing, and retrieval outputs must bypass compression so recovery actually returns full text.

Use native DSH code execution and lazy tool discovery where available. Do not create a second execution or permission system. Custom providers already belong to DSH's provider controls. Cost/cache indicators can use native usage data, with unavailable fields marked unavailable. Do not invent a provider-independent cache temperature or automatically send paid keep-warm requests.

## Follow-on features

Duplicate-result references require proof that the previous result remains in active context, matching content, and unchanged relevant state. Defer them until context lifetime can be verified. Event-driven process waiting requires native cancellation, permission, and interrupt handling; use existing facilities first and identify any necessary upstream extension separately. Check batching should reuse native handlers and preserve each command's result, approval, cancellation, and recovery evidence. These features are separate from the initial compression release rather than claims of completed parity.

## Validation and acceptance

Test codec round trips for Unicode, mixed newline forms, missing final newline, marker-like input, repeated blocks, diagnostics, and incompressible output. Test storage and cancellation failures, metadata preservation, retrieval bypass, disable/disposal, and interaction with spill policies. Run real Harness Loader composition in an isolated profile against multiple model routes; capture the actual provider request and recover the exact original output. Validate the client page and full-output view.

Run paired tasks with compression off, safe, and lean modes on more than one model family. Record task success, input/output/cache usage, calls, retries, recovery reads, and runtime. Include recovery overhead and distinguish estimates from provider-reported usage. A codec test establishes reversibility, not unchanged model task quality. Package only after integration checks pass; live installation is a subsequent activation step.

## Sources

- https://github.com/Retro2512/CodexZero
- https://github.com/Retro2512/CodexZero/blob/main/docs/architecture.md
- https://www.reddit.com/r/codex/comments/1v5dct6/burned_my_full_200_plan_3_rests_while_asking/
- Local Harness: packages/core/tools/src/index.ts; packages/spill/spill/src/index.ts; packages/spill/spill-policy/src/index.ts; packages/llm/token-meter/src/estimate.ts; packages/llm/llm/src/index.ts.
