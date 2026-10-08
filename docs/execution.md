# SDD ledger — plan: /mnt/slow-stuff/deepseek/docs/superpowers/plans/2026-10-08-dsh-zero.md
Pre-flight: Tasks 1/2 share selector and codec exports; Tasks 2/3 share saveOriginal and record; Tasks 3/4 share artifact API. Interfaces aligned.
Ruling: Use a fresh plugin repository on feat/dsh-zero as isolation — workspace root has no repository and no existing plugin work — no unrelated source changes.

Task 1: complete — 15 tests passed; commit c704c64.

Ruling: Emit explicit strict native Typert contributions from validated contracts — standalone generator requires a packages/ monorepo inventory; native registry supports manual contributions — integration will test real gateway rejection and invocation.
Ruling: Initially compress a single text block only and cap input at 16 MiB — preserves all block boundaries and bounds CPU/storage — mixed results bypass and save less context.
Task 2: policy tests passed 13/13; host composition and lifecycle checks pending Task 4.

Task 3: complete — service, controller, UI tests pass; client and host build pass.
Task 2: complete — native Loader composition proves settings reload, off/lean/exact-only, spill-policy order, storage fallback and cancellation.
Task 4: complete — 41 unit/DOM checks, native composition/client lifecycle, six AgentLoop HTTP fixture cases, paired manifest benchmark, and isolated tarball install/composition all pass.
Ruling: Benchmark CLI uses positional manifest/report paths rather than named flags — smaller runner and documented invocation — cost if wrong: adding argument aliases.
Final review: one P2 retry counter listened on wrong event channel and native retry executor absent. Reproduced RED (0 versus 1 retry), fixed native Retry mount and durable llm/retry-started counting; fail-once plus budget-capped checks GREEN. No deferred findings.
