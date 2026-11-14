# DSH 0.2.2-rc.3 qualification

Package: `@arzvaak/dsh-zero@0.1.0-english.20261023.rc3.20261114.1`. Checked 2026-11-14 against the actual built RC3 checkout.

The actual host `evaluatePluginCompatibility` preflight accepts this manifest. The package host entry imports against actual RC3 modules. These are bounded loader/API checks; desktop flows need the complete profile smoke.

Zero: 41 unit/UI tests pass; compression preserves full source recovery, cancellation and counting behavior. Metadata adds exact RC3 alongside previously supported versions; no broad host exemption.
