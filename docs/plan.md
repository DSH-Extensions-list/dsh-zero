# DSH Zero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Ship a model-independent DSH plugin providing reversible tool-output compression, original-output recovery, optional lean guidance, and measured savings.

**Architecture:** Native Cordis post-execute policy calls a pure codec and model-aware candidate selector, then saves original text through DSH spill storage. A Cordis service exposes metadata and bounded artifact reads through the authenticated native Remote gateway; a React settings page consumes that service. Existing inference, tool execution, and permission machinery remain authoritative.

**Tech Stack:** Node 24, ESM, TypeScript for typed host/client Remote contracts, React 18, esbuild, node:test, native Cordis/DSH services.

**Spec:** `/mnt/slow-stuff/deepseek/research/dsh-zero-design.md`

## Global Constraints

- No provider credentials, inference routing, or hardcoded model requirement.
- Safe is the initial default; lean can change model behavior and must be benchmarked separately.
- Save original text before selecting compressed content; failures return original content.
- Preserve error state, exit/process metadata, call identity, and structured program values.
- No rewriting agent-loop requests through `llm/stream`.
- Exact counts, estimates, byte reduction, and provider usage must be labeled separately.
- Compression must compose with existing spill policies without double processing.
- Retrieval outputs must bypass compression.
- Live installation is a subsequent activation step.
- Implement in a new `/mnt/slow-stuff/deepseek/dsh-zero` directory. The workspace root is not a Git repository; initialize only this new plugin repository and commit its files, never neighboring projects.
- Verified source baseline: Harness `639ed015397290b3745d163aafe02ffee4aa3f84`. Capture actual supported version from its package metadata at packaging time.

## Review Focus

- Marker-looking original text must decode literally rather than become codec instructions (Task 1).
- A route change must invalidate the previous tokenizer selection (Task 1/2).
- Existing spill policy and late plugin reload must not double-compress results or leave listeners behind (Task 2/4).
- Viewer reads must be limited to plugin-issued artifacts and remain bounded for large output (Task 3).
- Savings after retrieval must include recovery overhead rather than advertise gross savings as net savings (Task 3/4).

## File Map

All following paths are relative to `dsh-zero/`.

- `src/codec.js`: reversible text format and decoder.
- `src/selection.js`: exact or estimated candidate selection.
- `src/policy.js`: post-execute integration and recovery exclusions.
- `src/service.ts`: counters, session-owned artifact registry, native Remote methods.
- `src/host.ts`: Config schema, lifecycle-managed policy/service/prompt registration.
- `src/lean.js`: optional concise supplementary guidance.
- `src/client.tsx`, `src/controller.js`, `src/style.js`: settings page and output viewer.
- `src/contracts.ts`: shared plain-data service contracts.
- `scripts/build.mjs`: build host/client and native Remote contribution using Harness's supported Typert tooling.
- `scripts/composition.mjs`: isolated real Loader/tools/spill/gateway/provider integration.
- `scripts/benchmark.mjs`: paired off/safe/lean task runner and evidence report.
- `tests/codec.test.js`, `tests/selection.test.js`, `tests/policy.test.js`, `tests/service.test.js`, `tests/client.test.js`: behavioral checks.
- `package.json`, `cordis.patch.yml`, `README.md`, `LICENSE`, `.gitignore`: installable bundle and release documentation.

### Task 1: Reversible codec and model-aware selection

**Interfaces:** `encodeText(text: string): string`; `decodeText(encoded: string): string`; `selectCandidate({original, candidate, countTokens?, minimumReduction}): {selected: boolean, basis: 'exact'|'estimated', originalCount: number, retainedCount: number}`. Counts include the complete final candidate, including its recovery notice. `countTokens` is synchronous and returns a finite nonnegative integer or throws; errors reject the candidate.

- [x] Write round-trip tests asserting `decodeText(encodeText(input)) === input` for LF, CRLF, lone CR, Unicode, empty text, no final newline, codec-marker text, and repeated multi-line blocks. Assert decoder rejects malformed counts and bounded expansion violations.
- [x] Run `node --test tests/codec.test.js` and confirm it fails because codec exports do not exist.
- [x] Implement a versioned literal/repeat record format that preserves complete line terminators; cap decoder expansion and verify equality before policy selection. Encode only consecutive repetition in this release.
- [x] Write selector tests: exact count greater/equal returns false; exact smaller returns true; callback failure returns false; estimated mode requires at least 20% reduction including notice; no tokenizer in strict mode bypasses. Assert one model's tokenizer never prices another model's output.
- [x] Run selector tests to observe failure, then implement `selection.js`. Keep unknown tokenizer mappings unknown; do not map by guessed model-name substrings.
- [x] Run both test files and commit `feat: add reversible codec and candidate selection`.

### Task 2: Native result policy, storage and optional lean mode

**Interfaces:** `createPolicy({saveOriginal, record, resolveCounter, config}) -> postExecuteListener`; `saveOriginal(exec, originalText) -> Promise<{id, retrievalHint}>`; `record(entry) -> void`. `resolveCounter(exec)` resolves the current provider/model on each execution. The policy calls `next()` first and respects its accept/block/value decision. `config` contains `mode: 'off'|'safe'|'lean'`, `counting: 'estimated'|'exact-only'`, `minimumReduction: 0.2`, and `minimumBytes: 4096`.

- [x] Write policy tests asserting original output on storage failure, aborted signal, absent owner, unsupported blocks, exact-only without tokenizer, accepted value replacement, and downstream block decisions. Assert unique diagnostics, current metadata and additional contexts survive compression.
- [x] Run `node --test tests/policy.test.js` and observe failure.
- [x] Implement text-block-only compression through `tools/post-execute`; bypass `read`, plugin recovery methods, nested code-mode calls, and content already carrying a spill locator or codec envelope. Keep mixed or structured content unchanged for this release. Store originals through `ctx.spillStore.saveText`, retaining each block boundary in the artifact representation.
- [x] Add Config and Cordis registrations in `host.ts`. Resolve missing optional storage/prompt services by bypassing their feature. Use `ctx.systemPrompt.section` for lean guidance; disposal removes the section and listeners. Off registers no policy or guidance.
- [x] Add tests for spill-policy order, disabling/re-enabling and listener disposal. Run policy tests and commit `feat: integrate native output policy and recovery storage`.

### Task 3: Savings service, settings page and original-output viewer

**Interfaces:** `ZeroService.snapshot() -> Snapshot`; `ZeroService.listArtifacts(sessionId, cursor?) -> ArtifactPage`; `ZeroService.readArtifact(id, offset, length) -> ArtifactChunk`. `Snapshot` separates bytes, estimated counts, exact counts, recovery bytes/counts and bypass reasons. Artifact IDs are opaque plugin-issued IDs; reads accept no filesystem path. Limit reads to 65536 UTF-8 bytes per request and artifact listings to 50 entries per page. `ArtifactChunk` includes content, next offset, EOF, total bytes and session ID. Counters initially cover this host activation and state that scope in the UI.

- [x] Write service tests for forged IDs, negative/oversized ranges, session ownership, Unicode chunk boundaries, concurrent records, and recovery overhead. Run them to observe failure.
- [x] Implement `service.ts` and `contracts.ts` using native Cordis service/Remote contribution registration. Read only registered saved artifacts through the native filesystem capability and verify ownership; do not expose arbitrary paths or add an unauthenticated HTTP server.
- [x] Write client tests asserting exact/estimated labels, host-activation scope, unavailable billing fields, full-output paging, loading/error states, stale settings revisions, and unmount cleanup.
- [x] Implement controller and React page in the native settings slot. Use Settings describe/mutate with namespace revisions for mode/counting controls. Render stored output as literal text. Show gross reduction and recovery overhead separately; net token reduction is unavailable when accounting bases differ.
- [x] Implement `scripts/build.mjs` and package host/client exports plus native Remote contributions. Use adjacent provider-hub client slot patterns and the source checkout's Typert plugin examples; inspect actual API signatures before writing registration code.
- [x] Run unit/UI checks and build. Commit `feat: add savings settings and full-output viewer`.

### Task 4: Real Harness composition, paired evidence and package

**Interfaces:** `npm run test:composition` requires `DSH_SOURCE`; `npm run benchmark -- <manifest.json> <report.json>` consumes a JSON manifest containing named tasks, fixture workspaces, provider/model routes, repetition count, explicit budget, and deterministic success checks. No paid request occurs without a supplied benchmark budget and configured routes.

- [x] Write isolated Loader composition tests with real tools, spill-local, Settings and authenticated gateway. Use a local mock inference server exposing two differently named provider/model routes. Capture actual model requests, recover originals, inspect preserved canonical code-mode values, and confirm off mode leaves requests unchanged.
- [x] Test policy ordering with spill-policy, missing storage, reactivation, cancellation, strict unknown tokenizer, retained diagnostics, and actual client Remote artifact reads. Ensure teardown removes temporary profiles and listeners.
- [x] Run `DSH_SOURCE=/home/sushi/Applications/deepseek-harness-source npm run test:composition`; require explicit PASS for every integration case. These fixture routes establish integration independence, not real-model quality.
- [x] Implement the manifest-driven paired benchmark runner for off/safe/lean modes. Persist success, route identity, repetitions, runtime, calls, retries, recovery reads, provider input/output/cache usage, and estimates as separate fields. Use isolated copied workspaces and identical checks across modes.
- [x] Exercise the runner against the local fixtures. If a configured live benchmark budget is available, run more than one real model family; otherwise report real-model task-quality evaluation as pending rather than claiming unchanged quality.
- [x] Add README installation, default estimated-mode labeling, exact-only fallback, full-output recovery, counter lifetime, optional lean behavior, and follow-on feature boundaries. Add MIT license and bundle patch.
- [x] Run `npm test`, `npm run build`, composition, `npm pack --dry-run`, and `npm pack`. Inspect archive exports, manifest and bundled dependencies. Commit `feat: package validated DSH Zero plugin`.
- [x] Review the complete patch against the approved spec; report verified behavior and pending live quality/activation separately. Do not publish or modify the active desktop profile as part of packaging.

## Coverage and execution boundary

Tasks 1–4 cover every first-release requirement. Duplicate references, native wait changes, cache keep-warm, and additional batch tools remain follow-on work exactly as the spec describes. The tokenizer seam and strict fallback are implemented; universal exact-tokenizer availability is not promised. Existing provider configuration remains DSH-owned.

Self-review: interfaces align across tasks; marker input, route changes, spill/reload, bounded authorized viewing and recovery accounting each have a specific test. Default numeric thresholds above are implementation choices rather than upstream performance claims.

Execution recommendation: Native implementation in this chat, because policy, service and UI depend closely on shared interfaces. Review the plan before execution and select Native or Subagent-driven.
