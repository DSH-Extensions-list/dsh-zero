# Validation — 2026-10-08

Baseline: local DeepSeek Harness 0.2.0-rc.2, commit `639ed015397290b3745d163aafe02ffee4aa3f84`; Node 24.19.0.

- Unit/DOM suite: 41 passing checks for literal codec round trips, complete-candidate counting, route isolation, cancellation/storage bypasses, canonical policy decisions, bounded recovery, mixed-basis accounting, settings revisions and UI unmount handling.
- Real Loader composition: tools/spill/filesystem, canonical result preservation, native model read/recovery-overhead accounting, exact original recovery, strict gateway invocation/rejection, settings mode transitions, route-specific counter registration, cancellation, native spill-policy ordering, storage fallback and changed-file refusal.
- Native client lifecycle: client factory mounts real Remote descriptors and settings slot, reads an original through native client/gateway dispatch, disposes style/slot/namespace and reactivates twice. Settings mutations use the real host Settings service in the separate composition checks. Carrier is an in-process test bridge; a deployed authenticated browser session was not exercised.
- Real AgentLoop/pi-ai HTTP fixture: two simulated route identities × off/safe/lean, all six cases succeed; a fail-once provider case additionally verifies one native retry and a capped case verifies the call budget; actual request content equals durable tool-result text and the fixture verifies decode equality. The benchmark report records provider-shaped synthetic usage separately from text estimates.
- Package: npm tarball installed into a temporary prefix (two packages: plugin and zod), then full composition ran using installed host/client entries. Manifest, bundle patch and all exports were checked.
- Fresh final review found one retry-measurement issue; a failing fixture reproduced it, then durable retry-started accounting and native retry execution fixed it. No deferred findings remain.
- Active desktop profile and Harness source remain untouched. No live inference, paid requests, publication or registry upload occurred.

The fixture model is deterministic and explicitly understands the codec. These checks establish integration and reversibility; they do not establish real-model task quality, cost savings, cache behavior or universal compatibility with future Harness versions.
