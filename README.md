# DSH Zero

A model-independent DeepSeek Harness plugin that saves context by encoding consecutive repeated tool output. It keeps unique diagnostics and saves the full original through DSH's spill storage before changing the model-facing projection.

The plugin uses the model and provider already selected in DSH. It adds no inference endpoint, credentials, tool runner, or permission system.

## Modes

- **Safe** (default): reversible text compression with saved-original recovery.
- **Lean**: Safe plus a short supplementary instruction encouraging targeted reads and concise work. Model task quality in this mode requires separate evaluation.
- **Off**: original tool projections.

**Estimated** counting works with any model and requires at least 20% reduction in the complete candidate, including its recovery notice. Estimates use text length, not a provider tokenizer. **Exact only** leaves output unchanged without a registered tokenizer for the current provider/model. Register a synchronous exact tokenizer through `ctx.dshZeroCounters.register(provider, model, countTokens)`; it returns a disposer. A tokenizer must count the complete string and return a nonnegative integer. The plugin supplies no guessed tokenizer mappings.

## Install the packaged plugin

Requires Node 24 and DeepSeek Harness interfaces verified against `0.2.0-rc.2`, source commit `639ed015397290b3745d163aafe02ffee4aa3f84`. The native Cordis, Schemastery and Typert protocol peers are supplied by the running Harness. Other versions have not been verified.

After building and packing, install into the intended profile:

```sh
dsh plugin --profile <profile-name> add /absolute/path/arzvaak-dsh-zero-0.1.0.tgz
```

For a linked development checkout, use `dsh plugin --profile <profile-name> add /absolute/path/dsh-zero`. The package contains prebuilt host and client entries plus its native bundle patch. The full settings page requires the web/desktop settings, Remote gateway and slot services. Compression also works in headless profiles with tools, spill storage and native filesystem services. Missing storage leaves original output unchanged.

Open **Settings → DSH Zero** to choose the mode/counting, inspect counters, and page through saved originals. Activation in an existing desktop profile is a separate step; this repository's validation uses disposable profiles.

## Recovery and measurements

Compressed text includes an execution-readable original path and DSH's normal `read` guidance. `read` results bypass compression. The settings viewer reads opaque registered IDs through DSH's existing Remote transport, in windows of at most 65,536 UTF-8 bytes. It rejects wrong-session IDs, forged paths, changed files and expired files. The surrounding DSH gateway supplies authentication; the plugin creates no HTTP endpoint.

Counters cover the current host/plugin activation. They separate bytes, estimated counts, exact counts, model recovery overhead and viewer reads. Net projection reduction becomes unavailable when recovery uses a different counting basis/tokenizer or registry eviction prevents reliable tracking. They do not measure billing, caching or savings from repeatedly replayed context. Viewer reads do not enter model context. Native model file reads of registered original paths contribute recovery overhead; other ways of accessing originals cannot be fully attributed.

The artifact registry retains up to 1,000 entries by default (configurable to 10,000). Metadata and counters reset when the plugin is reloaded. Saved files follow DSH spill-storage retention; their native paths remain usable while the underlying files exist.

## Compatibility and limits

Version 0.1 compresses one text block containing consecutive repeated lines/blocks. It preserves line endings, Unicode, order and the final newline, validates a codec round trip, and preserves canonical program values and tool metadata. Mixed content, nested code-mode results, recovery reads, malformed Unicode and unsupported results bypass compression. Default eligible size is 4 KiB–16 MiB. Codec payloads use `DSH-ZERO/1` ordered `[repeatCount, literalText]` records; a native original is always available for models that prefer reading it.

Existing spill policies remain authoritative; already spilled outputs bypass this codec. Stock inline output may show the encoded projection; use the explicit original viewer. Codec reversibility establishes data preservation, not equivalent reasoning quality for every model.

Duplicate-result references, keep-warm requests, new waiting/batching tools and CodexZero feature parity are outside this first release.

## Develop and verify

```sh
npm ci
npm test
npm run build
DSH_SOURCE=/absolute/path/to/built/deepseek-harness npm run test:composition
DSH_SOURCE=/absolute/path/to/built/deepseek-harness npm run test:loop
npm pack
DSH_SOURCE=/absolute/path/to/built/deepseek-harness npm run test:package
```

The composition check uses real Loader, Settings, tools, filesystem/spill storage, strict Typert gateway and native client Remote/slot lifecycle. The loop check drives real AgentLoop and pi-ai through a local HTTP/SSE fixture on two route identities, with off/safe/lean modes and durable-result/request equality.

Run a paired local fixture benchmark:

```sh
DSH_SOURCE=/absolute/path/to/built/deepseek-harness npm run benchmark -- examples/fixture-benchmark.json artifacts/benchmark.json
```

A manifest must explicitly specify `fixture`, repetitions, routes, tasks, success markers and per-case call/output/time budgets. For live runs set `fixture:false` and provide each route's native pi-ai `profile` with `api`, `baseURL`, `apiKeyEnv`, and `models` containing `id`, `contextWindow` and `maxTokens`. Environment variables hold credentials; reports exclude profiles. `fixtureWorkspace` is copied per case; optional `outputFile` supplies diagnostic content and `success.files` checks expected relative paths. Each case registers the same `fixture_output` task tool. This evaluates compression-specific diagnostic/repair tasks, rather than a general coding benchmark. All successful native `read` calls are recorded in the benchmark's `recoveryReads` field; they may include ordinary file reads.

The runner executes off/safe/lean with identical checks and writes route identity, success, runtime, calls, durable started retries, budget exhaustion, file reads, provider usage and separate estimates. It never initiates a live route without an explicit manifest budget. Fixture usage is synthetic. See [validation](docs/validation.md) and [fixture evidence](docs/fixture-benchmark.json). Live model task quality and billing savings remain unverified.
